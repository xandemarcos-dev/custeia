import ExcelJS from "exceljs";
import path from "path";

interface Produto {
  codigo: number;
  nome: string;
  custoMedioAtual: number;
}

interface Entrada {
  codigo: number;
  data: Date;
  quantidade: number;
  precoUnitario: number;
}

interface Ingrediente {
  codigo: number;
  qtd: number;
}

interface FichaTecnica {
  nome: string;
  yieldQty: number;
  unitPrice: number;
  packagingCost: number;
  ingredientes: Ingrediente[];
}

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

/**
 * Calcula o impacto financeiro real da defasagem de custo
 * Integra: Tarefa 1 (custos antigos/novos), Tarefa 2 (volume mensal), Tarefa 3 (ingredientes da receita)
 *
 * LÓGICA:
 * 1. FT tem lista de ingredientes com Quantidade (coluna C) e Preço Unitário (coluna H)
 * 2. Cálculo original: Custo = Quantidade × Preço Unitário
 * 3. Nosso cálculo:
 *    - Custo ANTIGO: Quantidade × Preço Unitário da PRIMEIRA compra do ingrediente
 *    - Custo ATUAL: Quantidade × Preço Unitário do CUSTO MÉDIO atual (Estoque)
 */
async function calcularMargemAntesDepois(
  nomeProdutoFT: string,
  codigoProdutoVenda: number,
  unidadesVendidasMes: number
): Promise<ResultadoMargem> {
  const estoquePath = path.join(__dirname, "..", "..", "Estoque 2026.xlsx");
  const ftPath = path.join(__dirname, "..", "..", "FT.xlsx");

  // ========== 1. LER ESTOQUE (Produtos + Entradas) ==========
  let wb: ExcelJS.Workbook;
  try {
    wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(estoquePath);
  } catch (error) {
    throw new Error(
      `Não foi possível ler o arquivo de estoque: ${estoquePath}. Erro: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Mapear: código produto → { custoMedioAtual }
  const produtos = new Map<number, Produto>();
  const prodSheet = wb.getWorksheet("Produtos");

  prodSheet?.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const codigo = row.getCell(1).value as number;
    const nome = row.getCell(2).value as string;
    let custoMedioAtual = row.getCell(8).value as number; // Coluna H (8)

    // Tratar caso onde valor é objeto (fórmula calculada)
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

  // Mapear: código → [histórico de compras ordenado por data]
  const primeiraCompra = new Map<number, Entrada>();
  const entradaSheet = wb.getWorksheet("Entradas");

  entradaSheet?.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const data = row.getCell(1).value as Date;
    const codigo = row.getCell(2).value as number;
    const quantidade = row.getCell(6).value as number;
    const precoUnitario = row.getCell(7).value as number;

    if (codigo && precoUnitario && data) {
      // Manter apenas a PRIMEIRA (mais antiga) entrada por código
      if (!primeiraCompra.has(codigo)) {
        primeiraCompra.set(codigo, {
          codigo,
          data,
          quantidade,
          precoUnitario,
        });
      } else {
        // Comparar datas e manter a mais antiga
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

  // ========== 2. LER FICHA TÉCNICA (FT.xlsx) ==========
  let ftWb: ExcelJS.Workbook;
  try {
    ftWb = new ExcelJS.Workbook();
    await ftWb.xlsx.readFile(ftPath);
  } catch (error) {
    throw new Error(
      `Não foi possível ler o arquivo de ficha técnica: ${ftPath}. Erro: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Procurar aba com o nome do produto
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
    throw new Error(
      `Ficha técnica de "${nomeProdutoFT}" não encontrada em FT.xlsx`
    );
  }

  // Extrair dados da FT
  const yieldQtyValue = ftSheet.getCell("L3").value;
  const yieldQty =
    typeof yieldQtyValue === "string"
      ? parseInt(yieldQtyValue, 10)
      : (yieldQtyValue as number);

  // Preço de venda POR PORÇÃO (não por lote)
  let unitPrice = ftSheet.getCell("L19").value as number;
  if (unitPrice && typeof unitPrice === "object") {
    if ("result" in unitPrice) {
      unitPrice = (unitPrice as any).result as number;
    }
  }

  // Custo de embalagem (coluna L, linha 8)
  let packagingCost = (ftSheet.getCell("L8").value as number) || 0;
  if (packagingCost && typeof packagingCost === "object") {
    if ("result" in packagingCost) {
      packagingCost = (packagingCost as any).result as number;
    }
  }

  // Extrair ingredientes com quantidade (coluna C = unidades do insumo) da FT
  // Bloco 1: Massa (linhas 8-17)
  // Bloco 2: Cobertura (linhas 23-32)
  const ingredientes: Ingrediente[] = [];

  // Bloco 1: Massa
  for (let row = 8; row <= 17; row++) {
    const codigoCell = ftSheet.getCell(`A${row}`).value;
    const qtdCell = ftSheet.getCell(`C${row}`).value; // Coluna C = quantidade em unidades

    if (codigoCell !== null && codigoCell !== undefined && qtdCell) {
      ingredientes.push({
        codigo: codigoCell as number,
        qtd: (qtdCell as number) || 0,
      });
    }
  }

  // Bloco 2: Cobertura/Confeitos
  for (let row = 23; row <= 32; row++) {
    const codigoCell = ftSheet.getCell(`A${row}`).value;
    const qtdCell = ftSheet.getCell(`C${row}`).value; // Coluna C = quantidade em unidades

    if (codigoCell !== null && codigoCell !== undefined && qtdCell) {
      ingredientes.push({
        codigo: codigoCell as number,
        qtd: (qtdCell as number) || 0,
      });
    }
  }

  // ========== 3. CALCULAR CUSTOS ANTES/DEPOIS ==========
  let custoAntigo = packagingCost;
  let custoAtual = packagingCost;

  const ingredientesComCusto: Array<{
    codigo: number;
    nome: string;
    qtd: number;
    precoAntigo: number;
    precoAtual: number;
    custoAntigoTotal: number;
    custoAtualTotal: number;
  }> = [];

  for (const ing of ingredientes) {
    const prod = produtos.get(ing.codigo);
    const primeira = primeiraCompra.get(ing.codigo);

    if (!prod) {
      console.warn(
        `⚠️  Ingrediente código ${ing.codigo} não encontrado em Produtos`
      );
      continue;
    }

    const precoAntigo = primeira?.precoUnitario || prod.custoMedioAtual;
    const precoAtual = prod.custoMedioAtual;

    const custoAntigoIng = ing.qtd * precoAntigo;
    const custoAtualIng = ing.qtd * precoAtual;

    custoAntigo += custoAntigoIng;
    custoAtual += custoAtualIng;

    ingredientesComCusto.push({
      codigo: ing.codigo,
      nome: prod.nome,
      qtd: ing.qtd,
      precoAntigo,
      precoAtual,
      custoAntigoTotal: custoAntigoIng,
      custoAtualTotal: custoAtualIng,
    });
  }

  // Custo por porção (unitPrice é por PORÇÃO)
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

  // ========== 4. LOG DETALHADO ==========
  console.log("\n" + "=".repeat(70));
  console.log(`ANTES/DEPOIS: ${resultado.produto}`);
  console.log("=".repeat(70));
  console.log(`\nPreço de venda: R$ ${resultado.precoVenda.toFixed(2)} por porção`);
  console.log(`Rendimento: ${yieldQty} porções por lote`);
  console.log(`Volume mensal: ${unidadesVendidasMes} porções\n`);

  // Tabela de ingredientes
  console.log("COMPOSIÇÃO DA RECEITA:");
  console.log("-".repeat(70));
  console.log(
    `${"Ingrediente".padEnd(25)} | ${"Qtd".padEnd(6)} | ${"Preço Antigo".padEnd(15)} | ${"Preço Atual".padEnd(15)}`
  );
  console.log("-".repeat(70));

  ingredientesComCusto.forEach((ing) => {
    console.log(
      `${ing.nome.substring(0, 24).padEnd(25)} | ${ing.qtd.toFixed(2).padEnd(6)} | R$ ${ing.precoAntigo.toFixed(3).padEnd(13)} | R$ ${ing.precoAtual.toFixed(3).padEnd(13)}`
    );
  });

  console.log("-".repeat(70));
  console.log(
    `${"Embalagem".padEnd(25)} | ${"".padEnd(6)} | R$ ${packagingCost.toFixed(3).padEnd(13)} | R$ ${packagingCost.toFixed(3).padEnd(13)}`
  );
  console.log("=".repeat(70));

  // Resumo antes/depois
  console.log("\nCOM CUSTO CONGELADO (Primeira compra):");
  console.log(
    `  Custo por porção: R$ ${custoPorPorcaoAntigo.toFixed(2)}`
  );
  console.log(
    `  Margem por porção: R$ ${resultado.margemAntiga.r$.toFixed(2)} (${resultado.margemAntiga.pct.toFixed(1)}%)`
  );

  console.log("\nCOM CUSTO ATUAL (Custo médio móvel):");
  console.log(
    `  Custo por porção: R$ ${custoPorPorcaoAtual.toFixed(2)}`
  );
  console.log(
    `  Margem por porção: R$ ${resultado.margemNova.r$.toFixed(2)} (${resultado.margemNova.pct.toFixed(1)}%)`
  );

  // Diferença e impacto
  console.log("\n" + "=".repeat(70));
  console.log("IMPACTO FINANCEIRO:");
  console.log("=".repeat(70));
  console.log(
    `Gap por porção: R$ ${(resultado.gap.r$ > 0 ? "+" : "-")}${Math.abs(resultado.gap.r$).toFixed(2)}/porção`
  );
  console.log(
    `Gap mensal (${unidadesVendidasMes} porções/mês): R$ ${(resultado.gap.mensal > 0 ? "+" : "-")}${Math.abs(resultado.gap.mensal).toFixed(2)}/mês`
  );
  console.log(
    `Gap anual: R$ ${(Math.abs(resultado.gap.mensal) * 12 > 0 ? "+" : "-")}${(Math.abs(resultado.gap.mensal) * 12).toFixed(2)}/ano`
  );
  console.log("=".repeat(70) + "\n");

  return resultado;
}

// ========== EXECUÇÃO ==========
async function main() {
  try {
    // Dados do best-seller (obtidos da Tarefa 2)
    // Ajuste estes valores conforme resultado da Tarefa 2
    const NOME_PRODUTO_FT = "Tradicional ao Leite";
    const CODIGO_PRODUTO_VENDA = 7; // A ser confirmado
    const UNIDADES_MES = 671; // Dado da memória: 671 unidades/mês

    const resultado = await calcularMargemAntesDepois(
      NOME_PRODUTO_FT,
      CODIGO_PRODUTO_VENDA,
      UNIDADES_MES
    );

    // Retornar resultado estruturado (opcional: salvar em JSON)
    console.log("\n📊 Resultado estruturado (JSON):");
    console.log(JSON.stringify(resultado, null, 2));
  } catch (error) {
    console.error("❌ Erro ao calcular margem:", error);
    process.exit(1);
  }
}

main();
