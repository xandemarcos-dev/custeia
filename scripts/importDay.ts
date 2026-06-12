/**
 * Importador das planilhas reais da Day para o BatchFlow.
 *
 *   pnpm exec tsx scripts/importDay.ts --dry-run     ← ensaio (não grava nada)
 *   pnpm exec tsx scripts/importDay.ts               ← importa de verdade
 *
 * Lê `Estoque 2026.xlsx` (categorias, insumos, estoque atual) e `FT.xlsx`
 * (uma aba por receita). Específico para o layout da Day — clientes com
 * planilhas diferentes ganham seu próprio script (decisão no BACKLOG #3).
 *
 * Regras honradas:
 * - Estoque/custo inicial entram como UMA compra de "saldo inicial" via
 *   registerIngredientEntry (regra de ouro preservada, com trilha de auditoria).
 * - Idempotente: nomes já existentes são pulados; rodar 2× não duplica.
 * - Margem alvo padrão 50% · custos fixos 30% (Custos+%Fixos = CMV × 1,30 nas FTs).
 */
import "dotenv/config";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { registerIngredientEntry } from "@/services/registerIngredientEntry";

const DRY = process.argv.includes("--dry-run");
const ESTOQUE_PATH = process.argv[2]?.startsWith("--") ? "../Estoque 2026.xlsx" : (process.argv[2] ?? "../Estoque 2026.xlsx");
const FT_PATH = process.argv[3]?.startsWith("--") ? "../FT.xlsx" : (process.argv[3] ?? "../FT.xlsx");

const CATEGORY_COLORS = ["#c2185b", "#6d4c41", "#1565c0", "#2e7d32", "#e65100", "#5e35b1", "#00838f", "#9e9d24"];

// ── helpers de célula ──────────────────────────────────────────
type CellValue = ExcelJS.CellValue;
function raw(ws: ExcelJS.Worksheet, row: number, col: number): CellValue {
  let v = ws.getRow(row).getCell(col).value;
  if (v && typeof v === "object" && "result" in v) v = (v as { result: CellValue }).result;
  if (v && typeof v === "object" && "richText" in v)
    v = (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
  return v;
}
const txt = (ws: ExcelJS.Worksheet, r: number, c: number) => String(raw(ws, r, c) ?? "").trim();
function num(ws: ExcelJS.Worksheet, r: number, c: number): number | null {
  const v = raw(ws, r, c);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : null;
}

// "gr" da planilha → base canônica do app
function toBase(und: string): string {
  const u = und.toLowerCase();
  if (["g", "gr", "grama", "gramas"].includes(u)) return "g";
  if (["ml", "l", "litro", "litros"].includes(u)) return "ml";
  return "un";
}

const report = { categorias: 0, unidades: 0, insumos: 0, saldos: 0, receitas: 0, pulados: [] as string[] };
const skip = (msg: string) => report.pulados.push(msg);

async function main() {
  const ws = await prisma.workspace.findFirstOrThrow();
  console.log(`Workspace: ${ws.name}${DRY ? "  [DRY-RUN — nada será gravado]" : ""}\n`);

  const estoqueWb = new ExcelJS.Workbook();
  await estoqueWb.xlsx.readFile(ESTOQUE_PATH);
  const ftWb = new ExcelJS.Workbook();
  await ftWb.xlsx.readFile(FT_PATH);

  // ── 1. Categorias de insumo ─────────────────────────────────
  const catSheet = estoqueWb.getWorksheet("Categorias");
  if (!catSheet) throw new Error('Aba "Categorias" não encontrada.');
  const categoryIdByName = new Map<string, string>(); // "Laticínios" → id
  const categoryIdByCode = new Map<string, string>(); // "1" → id
  let colorIdx = 0;
  for (let r = 2; r <= catSheet.rowCount; r++) {
    const code = txt(catSheet, r, 1);
    const name = txt(catSheet, r, 2);
    if (!name) continue;
    let cat = await prisma.category.findFirst({ where: { workspaceId: ws.id, name } });
    if (!cat) {
      report.categorias++;
      if (!DRY) {
        cat = await prisma.category.create({
          data: { workspaceId: ws.id, name, color: CATEGORY_COLORS[colorIdx++ % CATEGORY_COLORS.length] },
        });
      }
    }
    const resolvedId = cat?.id ?? `dry-${name}`;
    categoryIdByName.set(name, resolvedId);
    if (code) categoryIdByCode.set(code, resolvedId);
  }

  // ── 2. Unidades (uma por volume distinto + bases g/ml/un) ──
  const prodSheet = estoqueWb.getWorksheet("Produtos");
  if (!prodSheet) throw new Error('Aba "Produtos" não encontrada.');

  async function ensureUnit(name: string, baseUnit: string, factor: number): Promise<string> {
    const existing = await prisma.unit.findFirst({
      where: { workspaceId: ws.id, baseUnit, toBaseFactor: factor },
    });
    if (existing) return existing.id;
    report.unidades++;
    if (DRY) return `dry-${name}`;
    const u = await prisma.unit.create({
      data: { workspaceId: ws.id, name, baseUnit, toBaseFactor: factor },
    });
    return u.id;
  }

  // ── 3. Insumos + saldo inicial ──────────────────────────────
  const estSheet = estoqueWb.getWorksheet("Estoque");
  const stockByCode = new Map<number, number>();
  if (estSheet) {
    for (let r = 2; r <= estSheet.rowCount; r++) {
      const code = num(estSheet, r, 1);
      const stock = num(estSheet, r, 8);
      if (code != null && stock != null) stockByCode.set(code, stock);
    }
  }

  const ingredientIdByCode = new Map<number, string>();
  for (let r = 2; r <= prodSheet.rowCount; r++) {
    const code = num(prodSheet, r, 1);
    const name = txt(prodSheet, r, 2);
    if (code == null || !name) continue;
    const brand = txt(prodSheet, r, 3) || null;
    const und = txt(prodSheet, r, 4) || "gr";

    // Detecta se a coluna 5 tem um volume real ou se foi omitida (células puladas).
    // Quando omitida, a coluna 5 assume o valor da categoria (número pequeno 1–13)
    // e todas as colunas seguintes ficam deslocadas — catName estaria na col 6, avgRaw na col 7.
    const col5 = num(prodSheet, r, 5);
    const col6raw = txt(prodSheet, r, 6);
    const hasVolume = col5 != null && col5 > 13; // volumes são sempre >13 (ex: 200, 395, 1000)
    const volumeRaw = hasVolume ? col5 : null;
    const catName = hasVolume ? txt(prodSheet, r, 7) : col6raw;
    const avgRaw = hasVolume ? (num(prodSheet, r, 8) ?? 0) : (num(prodSheet, r, 7) ?? 0);

    // Se volume está preenchido (embalagem), custo médio = preço÷volume.
    // Se omitido, a Day cadastrou o preço por unidade-base diretamente.
    const volume = volumeRaw && volumeRaw > 1 ? volumeRaw : null;
    const avgCostPerBase = volume ? avgRaw / volume : avgRaw;

    const base = toBase(und);
    // Aceita tanto o nome ("Saborizantes") quanto o código ("3") da categoria.
    const categoryId = categoryIdByName.get(catName) ?? categoryIdByCode.get(catName);
    if (!categoryId) {
      skip(`Insumo "${name}" (linha ${r}): categoria "${catName}" desconhecida.`);
      continue;
    }

    const existing = await prisma.ingredient.findFirst({ where: { workspaceId: ws.id, name } });
    if (existing) {
      ingredientIdByCode.set(code, existing.id);
      continue; // idempotência: não recria nem relança saldo
    }

    const baseUnitId = await ensureUnit(base, base, 1);
    // Sem embalagem padrão: unidade de compra = a própria base (ex: g)
    const buyUnitId = !volume
      ? baseUnitId
      : await ensureUnit(
          volume === 1000 && base === "g" ? "kg" : `emb ${volume}${base}`.slice(0, 20),
          base,
          volume
        );

    report.insumos++;
    const stock = stockByCode.get(code) ?? 0;
    if (DRY) {
      if (stock > 0) report.saldos++;
      ingredientIdByCode.set(code, `dry-${code}`);
      continue;
    }

    const ing = await prisma.ingredient.create({
      data: {
        workspaceId: ws.id,
        name,
        brand,
        categoryId,
        baseUnitId,
        // avgCost por unidade-base mesmo sem estoque: receitas precisam do custo.
        avgCost: avgCostPerBase,
        notes: `Importado da planilha (código ${code}).`,
      },
    });
    ingredientIdByCode.set(code, ing.id);

    if (stock > 0) {
      report.saldos++;
      await registerIngredientEntry({
        workspaceId: ws.id,
        ingredientId: ing.id,
        entryDate: new Date(),
        purchaseUnitId: buyUnitId,
        purchaseQty: stock,
        // Para insumos sem embalagem, stock já é em g e unitPrice é por g.
        // Para insumos com embalagem, stock é em embalagens e unitPrice é por embalagem.
        unitPrice: volume ? avgRaw : avgCostPerBase,
        notes: "Saldo inicial importado da planilha Estoque 2026.",
      });
    }
  }

  // ── 4. Receitas (FT.xlsx — uma aba por receita) ─────────────
  let prodCat = await prisma.productCategory.findFirst({ where: { workspaceId: ws.id, name: "Importados" } });
  if (!prodCat && !DRY) {
    prodCat = await prisma.productCategory.create({
      data: { workspaceId: ws.id, name: "Importados", color: "#6d4c41" },
    });
  }

  type FtRow = { code: number; qty: number };
  function readBlock(sheet: ExcelJS.Worksheet, from: number, to: number): FtRow[] {
    const rows: FtRow[] = [];
    for (let r = from; r <= to; r++) {
      const code = num(sheet, r, 1);
      const qty = num(sheet, r, 4);
      if (code != null && qty != null && qty > 0) rows.push({ code, qty });
    }
    return rows;
  }

  for (const sheet of ftWb.worksheets) {
    const m = sheet.name.match(/^\d+\s*-\s*(.+)$/);
    if (!m) continue; // Menu, Tamanho - Gr, Geleias (layout próprio — fora desta rodada)
    const recipeName = m[1].trim();

    const yieldQty = num(sheet, 3, 12);
    const unitPrice = num(sheet, 19, 12);
    const packagingCost = num(sheet, 8, 12) ?? 0;
    const massa = readBlock(sheet, 8, 17);
    const cobertura = readBlock(sheet, 23, 32);

    if (!yieldQty || yieldQty <= 0) { skip(`Receita "${recipeName}": sem porções (L3).`); continue; }
    if (!unitPrice || unitPrice <= 0) { skip(`Receita "${recipeName}": sem valor de venda (L19).`); continue; }
    if (massa.length + cobertura.length === 0) { skip(`Receita "${recipeName}": sem ingredientes.`); continue; }

    const missing = [...massa, ...cobertura].filter((it) => !ingredientIdByCode.get(it.code));
    if (missing.length > 0) {
      skip(`Receita "${recipeName}": insumo(s) código ${missing.map((x) => x.code).join(", ")} não encontrado(s).`);
      continue;
    }

    const exists = await prisma.recipe.findFirst({ where: { workspaceId: ws.id, name: recipeName } });
    if (exists) continue;

    report.receitas++;
    if (DRY) continue;

    const recipe = await prisma.recipe.create({
      data: {
        workspaceId: ws.id,
        name: recipeName,
        categoryId: prodCat!.id,
        yieldQty,
        unitPrice,
        targetMarginPct: 50,
        packagingCost,
        fixedCostPct: 30,
        notes: `Importado de FT.xlsx (aba "${sheet.name}").`,
      },
    });
    const blocks: [string, FtRow[]][] = [["Massa", massa], ["Cobertura", cobertura]];
    let gIdx = 0;
    for (const [gName, rows] of blocks) {
      if (rows.length === 0) continue;
      const group = await prisma.recipeIngredientGroup.create({
        data: { recipeId: recipe.id, name: gName, orderIndex: gIdx++ },
      });
      await prisma.recipeIngredient.createMany({
        data: rows.map((it, i) => ({
          groupId: group.id,
          ingredientId: ingredientIdByCode.get(it.code)!,
          qtyInBase: it.qty,
          orderIndex: i,
        })),
      });
    }
  }

  // ── Relatório ───────────────────────────────────────────────
  console.log("Resultado:");
  console.log(`  Categorias novas:  ${report.categorias}`);
  console.log(`  Unidades novas:    ${report.unidades}`);
  console.log(`  Insumos novos:     ${report.insumos}`);
  console.log(`  Saldos iniciais:   ${report.saldos}`);
  console.log(`  Receitas novas:    ${report.receitas}`);
  if (report.pulados.length > 0) {
    console.log(`\nPulados (${report.pulados.length}):`);
    for (const p of report.pulados) console.log(`  - ${p}`);
  }
  console.log(DRY ? "\nDry-run: nada foi gravado." : "\nImportação concluída ✓");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
