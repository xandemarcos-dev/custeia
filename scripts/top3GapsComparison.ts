import ExcelJS from "exceljs";
import path from "path";
import { execSync } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
import { randomBytes } from "crypto";
import * as fs from "fs";

const execAsync = promisify(exec);

interface ResultadoMargem {
  produto: string;
  precoVenda: number;
  custoAntigo: number;
  custoAtual: number;
  margemAntiga: {
    r$: number;
    pct: number;
  };
  margemNova: {
    r$: number;
    pct: number;
  };
  gap: {
    r$: number;
    mensal: number;
  };
}

interface ProdutoVenda {
  codigoProduto: number;
  nome: string;
  unidadesVendidas: number;
  valorTotal: number;
  numeroPedidos: number;
  precoMedio: number;
}

interface BestSeller extends ProdutoVenda {
  ranking: number;
}

interface GapResult extends ResultadoMargem {
  unidadesVendidas: number;
}

/**
 * Extrai o top 5 best-sellers do Pedidos 2026.xlsx
 */
async function extrairTop5BestSellers(): Promise<BestSeller[]> {
  const excelPath = path.resolve(__dirname, "..", "..", "Pedidos 2026.xlsx");

  if (!fs.existsSync(excelPath)) {
    throw new Error(`Arquivo Excel não encontrado: ${excelPath}`);
  }

  const pythonCode = `from openpyxl import load_workbook
import json

COL_PEDIDO = 1
COL_PRODUTO = 6
COL_QTDE = 8
COL_PRECO_UNIT = 9
COL_TOTAL = 10

wb = load_workbook(r"${excelPath}", data_only=True)

# Ler Produtos
sheet_produtos = wb["Produtos"]
produtos = {}
for row_idx in range(2, sheet_produtos.max_row + 1):
    codigo = sheet_produtos.cell(row=row_idx, column=1).value
    nome = sheet_produtos.cell(row=row_idx, column=2).value

    if codigo and nome:
        codigo_int = int(codigo)
        produtos[str(codigo_int)] = str(nome)

# Ler Pedidos - Doces
sheet_pedidos = wb["Pedidos - Doces"]
vendas = {}
for row_idx in range(2, sheet_pedidos.max_row + 1):
    pedido = sheet_pedidos.cell(row=row_idx, column=COL_PEDIDO).value
    codigo_produto = sheet_pedidos.cell(row=row_idx, column=COL_PRODUTO).value
    qtde = sheet_pedidos.cell(row=row_idx, column=COL_QTDE).value
    preco_unit = sheet_pedidos.cell(row=row_idx, column=COL_PRECO_UNIT).value
    total = sheet_pedidos.cell(row=row_idx, column=COL_TOTAL).value

    if codigo_produto is None or qtde is None:
        continue

    codigo_str = str(int(codigo_produto))
    if codigo_str not in vendas:
        vendas[codigo_str] = {
            'unidades': 0,
            'valor': 0,
            'pedidos': set()
        }

    qtde_num = float(qtde) if qtde else 0
    total_num = float(total) if total else 0

    vendas[codigo_str]['unidades'] += qtde_num
    vendas[codigo_str]['valor'] += total_num

    if pedido is not None:
        vendas[codigo_str]['pedidos'].add(int(pedido))

resultado = {}
for codigo_str, venda_data in vendas.items():
    resultado[codigo_str] = {
        'unidades': venda_data['unidades'],
        'valor': venda_data['valor'],
        'numeroPedidos': len(venda_data['pedidos'])
    }

print(json.dumps({'produtos': produtos, 'vendas': resultado}))`;

  const randomSuffix = randomBytes(4).toString("hex");
  const tempPyPath = path.join(__dirname, "..", "..", `temp_venda_${randomSuffix}.py`);
  fs.writeFileSync(tempPyPath, pythonCode);

  try {
    const { stdout } = await execAsync(`python "${tempPyPath}"`);
    const data = JSON.parse(stdout);

    const resultados: ProdutoVenda[] = [];

    for (const [codigoStr, venda] of Object.entries(data.vendas)) {
      const v = venda as any;
      const nome = data.produtos[codigoStr] || `Produto ${codigoStr}`;
      const precoMedio = v.unidades > 0 ? v.valor / v.unidades : 0;

      resultados.push({
        codigoProduto: parseInt(codigoStr, 10),
        nome,
        unidadesVendidas: v.unidades,
        valorTotal: v.valor,
        numeroPedidos: v.numeroPedidos,
        precoMedio,
      });
    }

    // Ordenar por unidades vendidas (descendente)
    resultados.sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);

    // Retornar top 5
    return resultados.slice(0, 5).map((r, idx) => ({
      ...r,
      ranking: idx + 1,
    }));
  } finally {
    if (fs.existsSync(tempPyPath)) {
      fs.unlinkSync(tempPyPath);
    }
  }
}

/**
 * Calcula o impacto financeiro real da defasagem de custo
 */
async function calcularMargemAntesDepois(
  nomeProdutoFT: string,
  unidadesVendidasMes: number
): Promise<ResultadoMargem | null> {
  try {
    const estoquePath = path.join(__dirname, "..", "..", "Estoque 2026.xlsx");
    const ftPath = path.join(__dirname, "..", "..", "FT.xlsx");

    // Ler Estoque
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(estoquePath);

    const produtos = new Map();
    const prodSheet = wb.getWorksheet("Produtos");

    prodSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const codigo = row.getCell(1).value as number;
      const nome = row.getCell(2).value as string;
      let custoMedioAtual = row.getCell(8).value as number;

      if (custoMedioAtual && typeof custoMedioAtual === "object") {
        if ("result" in custoMedioAtual) {
          custoMedioAtual = (custoMedioAtual as any).result as number;
        }
      }

      if (codigo && nome) {
        produtos.set(codigo, {
          codigo,
          nome,
          custoMedioAtual: typeof custoMedioAtual === "number" ? custoMedioAtual : 0,
        });
      }
    });

    const primeiraCompra = new Map();
    const entradaSheet = wb.getWorksheet("Entradas");

    entradaSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const data = row.getCell(1).value as Date;
      const codigo = row.getCell(2).value as number;
      const quantidade = row.getCell(6).value as number;
      const precoUnitario = row.getCell(7).value as number;

      if (codigo && precoUnitario && data) {
        if (!primeiraCompra.has(codigo)) {
          primeiraCompra.set(codigo, {
            codigo,
            data,
            quantidade,
            precoUnitario,
          });
        } else {
          const existente = primeiraCompra.get(codigo)!;
          if (new Date(data).getTime() < new Date(existente.data).getTime()) {
            primeiraCompra.set(codigo, {
              codigo,
              data,
              quantidade,
              precoUnitario,
            });
          }
        }
      }
    });

    // Ler FT
    const ftWb = new ExcelJS.Workbook();
    await ftWb.xlsx.readFile(ftPath);

    let ftSheet = null;
    for (const sheet of ftWb.worksheets) {
      if (
        sheet.name.toLowerCase().includes(nomeProdutoFT.toLowerCase()) &&
        !sheet.name.toLowerCase().includes("tamanho")
      ) {
        ftSheet = sheet;
        break;
      }
    }

    if (!ftSheet) {
      console.warn(`⚠️  Ficha técnica de "${nomeProdutoFT}" não encontrada`);
      return null;
    }

    const yieldQtyValue = ftSheet.getCell("L3").value;
    const yieldQty =
      typeof yieldQtyValue === "string"
        ? parseInt(yieldQtyValue, 10)
        : (yieldQtyValue as number);

    let unitPrice = ftSheet.getCell("L19").value as number;
    if (unitPrice && typeof unitPrice === "object") {
      if ("result" in unitPrice) {
        unitPrice = (unitPrice as any).result as number;
      }
    }

    let packagingCost = (ftSheet.getCell("L8").value as number) || 0;
    if (packagingCost && typeof packagingCost === "object") {
      if ("result" in packagingCost) {
        packagingCost = (packagingCost as any).result as number;
      }
    }

    const ingredientes: Array<{ codigo: number; qtd: number }> = [];

    // Bloco 1: Massa
    for (let row = 8; row <= 17; row++) {
      const codigoCell = ftSheet.getCell(`A${row}`).value;
      const qtdCell = ftSheet.getCell(`C${row}`).value;

      if (codigoCell !== null && codigoCell !== undefined && qtdCell) {
        ingredientes.push({
          codigo: codigoCell as number,
          qtd: (qtdCell as number) || 0,
        });
      }
    }

    // Bloco 2: Cobertura
    for (let row = 23; row <= 32; row++) {
      const codigoCell = ftSheet.getCell(`A${row}`).value;
      const qtdCell = ftSheet.getCell(`C${row}`).value;

      if (codigoCell !== null && codigoCell !== undefined && qtdCell) {
        ingredientes.push({
          codigo: codigoCell as number,
          qtd: (qtdCell as number) || 0,
        });
      }
    }

    // Calcular custos
    let custoAntigo = packagingCost;
    let custoAtual = packagingCost;

    for (const ing of ingredientes) {
      const prod = produtos.get(ing.codigo);
      const primeira = primeiraCompra.get(ing.codigo);

      if (!prod) {
        continue;
      }

      const precoAntigo = primeira?.precoUnitario || prod.custoMedioAtual;
      const precoAtual = prod.custoMedioAtual;

      custoAntigo += ing.qtd * precoAntigo;
      custoAtual += ing.qtd * precoAtual;
    }

    // Custo por porção
    const custoPorPorcaoAntigo = custoAntigo / yieldQty;
    const custoPorPorcaoAtual = custoAtual / yieldQty;

    // Margem por PORÇÃO
    const margemAntigoR$ = unitPrice - custoPorPorcaoAntigo;
    const margemNovoR$ = unitPrice - custoPorPorcaoAtual;
    const margemAntigoPct = (margemAntigoR$ / unitPrice) * 100;
    const margemNovoPct = (margemNovoR$ / unitPrice) * 100;

    // Gap (unidadesVendidasMes refere-se a PORÇÕES)
    const gapR$ = margemAntigoR$ - margemNovoR$;
    const gapMensal = gapR$ * unidadesVendidasMes;

    const resultado: ResultadoMargem = {
      produto: nomeProdutoFT,
      precoVenda: unitPrice,
      custoAntigo,
      custoAtual,
      margemAntiga: {
        r$: margemAntigoR$,
        pct: margemAntigoPct,
      },
      margemNova: {
        r$: margemNovoR$,
        pct: margemNovoPct,
      },
      gap: {
        r$: gapR$,
        mensal: gapMensal,
      },
    };

    return resultado;
  } catch (error) {
    console.warn(
      `⚠️  Erro ao calcular margem para "${nomeProdutoFT}":`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Main: Executa análise dos top 5 e retorna top 3 com maior gap
 */
async function main() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("TAREFA 4+6: TOP 3 PRODUTOS COM MAIOR GAP FINANCEIRO");
    console.log("=".repeat(70));

    // 1. Extrair top 5 best-sellers
    console.log("\n📊 Extraindo top 5 best-sellers...");
    const top5 = await extrairTop5BestSellers();

    if (top5.length === 0) {
      console.error("❌ Nenhum best-seller encontrado");
      process.exit(1);
    }

    console.log(`✅ Top 5 best-sellers encontrados:`);
    top5.forEach((p) => {
      console.log(
        `   ${p.ranking}. ${p.nome} — ${p.unidadesVendidas.toFixed(0)} un/mês`
      );
    });

    // 2. Calcular margem para cada um
    console.log("\n📈 Calculando margem antes/depois para cada produto...");
    const gaps: GapResult[] = [];

    for (const produto of top5) {
      process.stdout.write(
        `   Processando ${produto.nome}... `
      );
      const margem = await calcularMargemAntesDepois(
        produto.nome,
        produto.unidadesVendidas
      );

      if (margem) {
        gaps.push({
          ...margem,
          unidadesVendidas: produto.unidadesVendidas,
        });
        console.log(`✅ Gap: -R$ ${Math.abs(margem.gap.mensal).toFixed(2)}/mês`);
      } else {
        console.log(`⚠️  FT não encontrada, pulando`);
      }
    }

    if (gaps.length === 0) {
      console.error("❌ Nenhum produto com FT encontrado");
      process.exit(1);
    }

    // 3. Filtrar produtos com margem válida (não null/NaN)
    const gapsValidos = gaps.filter(
      (g) =>
        g.margemAntiga.r$ !== null &&
        g.margemAntiga.r$ !== undefined &&
        !isNaN(g.margemAntiga.r$) &&
        g.gap.mensal !== null &&
        g.gap.mensal !== undefined &&
        !isNaN(g.gap.mensal)
    );

    if (gapsValidos.length === 0) {
      console.error("❌ Nenhum produto com margem válida encontrado");
      process.exit(1);
    }

    // 4. Ordenar por gap absoluto (descendente) e pegar top 3
    gapsValidos.sort((a, b) => Math.abs(b.gap.mensal) - Math.abs(a.gap.mensal));
    const top3Gaps = gapsValidos.slice(0, 3);

    // 5. Exibir resumo
    console.log("\n" + "=".repeat(70));
    console.log("TOP 3 PRODUTOS COM MAIOR GAP FINANCEIRO");
    console.log("=".repeat(70));

    top3Gaps.forEach((gap, idx) => {
      console.log(`\n${idx + 1}. ${gap.produto}`);
      console.log(
        `   Margem antiga: R$ ${gap.margemAntiga.r$.toFixed(2)}/porção (${gap.margemAntiga.pct.toFixed(1)}%)`
      );
      console.log(
        `   Margem nova: R$ ${gap.margemNova.r$.toFixed(2)}/porção (${gap.margemNova.pct.toFixed(1)}%)`
      );
      console.log(
        `   Gap mensal: -R$ ${Math.abs(gap.gap.mensal).toFixed(2)} (${gap.unidadesVendidas.toFixed(0)} un/mês)`
      );
    });

    // 5. Salvar resultado em JSON para uso pelo gerarCasoUsoHTML.ts
    const output = {
      top3Gaps,
      dataSaida: new Date().toISOString(),
    };

    const outputPath = path.join(__dirname, "top3Gaps.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ Resultado salvo em: ${outputPath}`);

    console.log("\n" + "=".repeat(70) + "\n");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

main();
