import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import { randomBytes } from 'crypto';

const execAsync = promisify(exec);

// ============================================================================
// INTERFACES
// ============================================================================

interface CustoCongelado {
  codigo: number;
  nome: string;
  marca: string;
  custoMedioAtual: number;
  custoAntigoCompra: number;
  dataCompraAntiga: Date;
  diasDesdeCompra: number;
  defasagemReais: number;
  defasagemPorcentagem: number;
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

interface Evaporacao {
  codigo: number;
  nome: string;
  gap: number;
  custoDia: number;
  custoMensal: number;
}

interface CasoUsoData {
  custosCongelados: CustoCongelado[];
  bestSeller: BestSeller | null;
  margem: ResultadoMargem | null;
  evaporacao: Evaporacao[];
  dataGeracao: string;
  lacunas: string[];
}

// ============================================================================
// TAREFA 1: CUSTO CONGELADO
// ============================================================================

async function extrairCustosCongelados(): Promise<CustoCongelado[]> {
  const excelPath = path.resolve(__dirname, '..', '..', 'Estoque 2026.xlsx');

  if (!fs.existsSync(excelPath)) {
    throw new Error(`Arquivo Excel não encontrado: ${excelPath}`);
  }

  const pythonCode = `from openpyxl import load_workbook
import json
from datetime import datetime

wb = load_workbook(r"${excelPath}", data_only=True)

# Ler Produtos
sheet_produtos = wb["Produtos"]
produtos = {}
for row_idx in range(2, sheet_produtos.max_row + 1):
    codigo = sheet_produtos.cell(row=row_idx, column=1).value
    nome = sheet_produtos.cell(row=row_idx, column=2).value
    marca = sheet_produtos.cell(row=row_idx, column=3).value
    custo_medio = sheet_produtos.cell(row=row_idx, column=8).value

    if codigo and nome:
        custo_val = 0
        if isinstance(custo_medio, (int, float)):
            custo_val = float(custo_medio)
        elif isinstance(custo_medio, str):
            try:
                custo_val = float(custo_medio)
            except (ValueError, TypeError):
                custo_val = 0

        codigo_int = int(codigo)
        produtos[str(codigo_int)] = {
            'codigo': codigo_int,
            'nome': str(nome),
            'marca': str(marca or ''),
            'custoMedioAtual': custo_val
        }

# Ler Entradas
sheet_entradas = wb["Entradas"]
entradas = {}
for row_idx in range(2, sheet_entradas.max_row + 1):
    data = sheet_entradas.cell(row=row_idx, column=1).value
    codigo = sheet_entradas.cell(row=row_idx, column=2).value
    quantidade = sheet_entradas.cell(row=row_idx, column=6).value
    preco_unitario = sheet_entradas.cell(row=row_idx, column=7).value

    if data is None or codigo is None or quantidade is None or preco_unitario is None:
        continue

    codigo_str = str(int(codigo))
    if codigo_str not in entradas:
        entradas[codigo_str] = []

    entradas[codigo_str].append({
        'data': data.isoformat() if isinstance(data, datetime) else str(data),
        'precoUnitario': float(preco_unitario),
        'quantidade': float(quantidade)
    })

result = {'produtos': produtos, 'entradas': entradas}
print(json.dumps(result))`;

  const randomSuffix = randomBytes(4).toString('hex');
  const tempPyPath = path.join(__dirname, '..', '..', `temp_extract_${randomSuffix}.py`);
  fs.writeFileSync(tempPyPath, pythonCode);

  try {
    const { stdout } = await execAsync(`python "${tempPyPath}"`);
    const data = JSON.parse(stdout);

    const resultados: CustoCongelado[] = [];
    const now = new Date();

    for (const [codigoStr, produto] of Object.entries(data.produtos)) {
      const p = produto as any;
      const entradasProduto = (data.entradas[codigoStr] || []) as Array<{
        data: string;
        precoUnitario: number;
        quantidade: number;
      }>;

      if (entradasProduto.length === 0) {
        continue;
      }

      const entradasComData = entradasProduto.map(e => ({
        ...e,
        dataObj: new Date(e.data),
      }));

      entradasComData.sort((a, b) => a.dataObj.getTime() - b.dataObj.getTime());
      const compraAntiga = entradasComData[0];

      const custoAntigoCompra = compraAntiga.precoUnitario;
      const diasDesdeCompra = Math.max(0, Math.floor(
        (now.getTime() - compraAntiga.dataObj.getTime()) / (1000 * 60 * 60 * 24)
      ));

      const defasagemReais = p.custoMedioAtual - custoAntigoCompra;
      const defasagemPorcentagem =
        custoAntigoCompra > 0
          ? (defasagemReais / custoAntigoCompra) * 100
          : 0;

      if (Math.abs(defasagemPorcentagem) > 5 && diasDesdeCompra >= 30) {
        resultados.push({
          codigo: p.codigo,
          nome: p.nome,
          marca: p.marca,
          custoMedioAtual: p.custoMedioAtual,
          custoAntigoCompra,
          dataCompraAntiga: compraAntiga.dataObj,
          diasDesdeCompra,
          defasagemReais,
          defasagemPorcentagem,
        });
      }
    }

    resultados.sort((a, b) => b.defasagemPorcentagem - a.defasagemPorcentagem);
    return resultados;
  } finally {
    if (fs.existsSync(tempPyPath)) {
      fs.unlinkSync(tempPyPath);
    }
  }
}

// ============================================================================
// TAREFA 2: PRODUTO MAIS VENDIDO
// ============================================================================

async function extrairProdutoMaisVendido(): Promise<BestSeller | null> {
  const excelPath = path.resolve(__dirname, '..', '..', 'Pedidos 2026.xlsx');

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

  const randomSuffix = randomBytes(4).toString('hex');
  const tempPyPath = path.join(__dirname, '..', '..', `temp_venda_${randomSuffix}.py`);
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

    resultados.sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);

    if (resultados.length > 0) {
      return {
        ...resultados[0],
        ranking: 1,
      };
    }

    return null;
  } finally {
    if (fs.existsSync(tempPyPath)) {
      fs.unlinkSync(tempPyPath);
    }
  }
}

// ============================================================================
// TAREFA 4: MARGEM ANTES/DEPOIS (Requer best-seller da Tarefa 2)
// ============================================================================

async function calcularMargemAntesDepois(
  nomeProdutoFT: string,
  unidadesVendidasMes: number
): Promise<ResultadoMargem | null> {
  try {
    const estoquePath = path.join(__dirname, '..', '..', 'Estoque 2026.xlsx');
    const ftPath = path.join(__dirname, '..', '..', 'FT.xlsx');

    // Usar ExcelJS para ler com fórmulas calculadas
    const ExcelJS = require('exceljs');

    // Ler Estoque
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(estoquePath);

    const produtos = new Map();
    const prodSheet = wb.getWorksheet('Produtos');

    prodSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const codigo = row.getCell(1).value as number;
      const nome = row.getCell(2).value as string;
      let custoMedioAtual = row.getCell(8).value as number;

      if (custoMedioAtual && typeof custoMedioAtual === 'object') {
        if ('result' in custoMedioAtual) {
          custoMedioAtual = (custoMedioAtual as any).result as number;
        }
      }

      if (codigo && nome) {
        produtos.set(codigo, {
          codigo,
          nome,
          custoMedioAtual: typeof custoMedioAtual === 'number' ? custoMedioAtual : 0,
        });
      }
    });

    const primeiraCompra = new Map();
    const entradaSheet = wb.getWorksheet('Entradas');

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
        !sheet.name.toLowerCase().includes('tamanho')
      ) {
        ftSheet = sheet;
        break;
      }
    }

    if (!ftSheet) {
      return null;
    }

    const yieldQtyValue = ftSheet.getCell('L3').value;
    const yieldQty = typeof yieldQtyValue === 'string' ? parseInt(yieldQtyValue, 10) : (yieldQtyValue as number);

    let unitPrice = ftSheet.getCell('L19').value as number;
    if (unitPrice && typeof unitPrice === 'object') {
      if ('result' in unitPrice) {
        unitPrice = (unitPrice as any).result as number;
      }
    }

    let packagingCost = (ftSheet.getCell('L8').value as number) || 0;
    if (packagingCost && typeof packagingCost === 'object') {
      if ('result' in packagingCost) {
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

    const custoPorPorcaoAntigo = custoAntigo / yieldQty;
    const custoPorPorcaoAtual = custoAtual / yieldQty;

    const margemAntigoR$ = unitPrice - custoPorPorcaoAntigo;
    const margemNovoR$ = unitPrice - custoPorPorcaoAtual;
    const margemAntigoPct = (margemAntigoR$ / unitPrice) * 100;
    const margemNovoPct = (margemNovoR$ / unitPrice) * 100;

    const gapR$ = margemAntigoR$ - margemNovoR$;
    const gapMensal = gapR$ * unidadesVendidasMes;

    return {
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
  } catch (error) {
    console.warn('Aviso: Não foi possível calcular margem:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// ============================================================================
// TAREFA 5: EVAPORAÇÃO
// ============================================================================

async function extrairEvaporacao(): Promise<Evaporacao[]> {
  const pythonScript = `
import pandas as pd
import json
from pathlib import Path

file_path = Path("../Estoque 2026.xlsx")

try:
    # Ler abas
    entradas_df = pd.read_excel(file_path, sheet_name='Entradas')
    saidas_df = pd.read_excel(file_path, sheet_name='Saidas')
    produtos_df = pd.read_excel(file_path, sheet_name='Produtos')

    # Coluna de Código pode variar
    cod_col = 'Código' if 'Código' in entradas_df.columns else [c for c in entradas_df.columns if 'odigo' in c][0]
    qty_col = 'Quantidade' if 'Quantidade' in entradas_df.columns else [c for c in entradas_df.columns if 'uantidade' in c][0]

    # Entradas: somar quantidade por código
    entrada_por_codigo = {}
    for _, row in entradas_df.iterrows():
        codigo = row[cod_col]
        qty = row[qty_col]
        if pd.notna(codigo) and pd.notna(qty) and codigo > 0:
            codigo = int(codigo)
            entrada_por_codigo[codigo] = entrada_por_codigo.get(codigo, 0) + float(qty)

    # Saídas: somar quantidade por código
    saida_por_codigo = {}
    saida_count = 0
    for _, row in saidas_df.iterrows():
        codigo = row[cod_col]
        qty = row[qty_col]
        if pd.notna(codigo) and pd.notna(qty) and codigo > 0:
            codigo = int(codigo)
            saida_por_codigo[codigo] = saida_por_codigo.get(codigo, 0) + float(qty)
            saida_count += 1

    # Produtos: nome e custo médio
    cod_col_prod = 'Código' if 'Código' in produtos_df.columns else [c for c in produtos_df.columns if 'odigo' in c][0]
    nome_col = 'Nome' if 'Nome' in produtos_df.columns else [c for c in produtos_df.columns if 'ome' in c][0]
    custo_col = 'Custo Médio' if 'Custo Médio' in produtos_df.columns else [c for c in produtos_df.columns if 'usto' in c and 'dio' in c][0]

    produtos = {}
    for _, row in produtos_df.iterrows():
        codigo = row[cod_col_prod]
        nome = row[nome_col]
        custo = row[custo_col]
        if pd.notna(codigo) and codigo > 0:
            codigo = int(codigo)
            produtos[codigo] = {'nome': nome, 'custo_dia': float(custo) if pd.notna(custo) else 0}

    # Calcular evaporação
    evaporacao = []

    for codigo, entrada_total in entrada_por_codigo.items():
        saida_total = saida_por_codigo.get(codigo, 0)

        if codigo in produtos:
            nome = produtos[codigo]['nome']
            custo_dia = produtos[codigo]['custo_dia']

            gap = entrada_total - saida_total

            if gap < 0:
                custo_mensal = abs(gap) * custo_dia * 30
                evaporacao.append({
                    'codigo': codigo,
                    'nome': nome,
                    'entrada': entrada_total,
                    'saida': saida_total,
                    'gap': gap,
                    'gap_abs': abs(gap),
                    'custo_dia': custo_dia,
                    'custo_mensal': custo_mensal,
                })

    # Ordenar por custo mensal descendente
    evaporacao.sort(key=lambda x: x['custo_mensal'], reverse=True)

    # JSON resultado
    resultado = [
        {
            'codigo': e['codigo'],
            'nome': e['nome'],
            'gap': round(e['gap_abs'] * 100) / 100,
            'custoDia': round(e['custo_dia'] * 100) / 100,
            'custoMensal': round(e['custo_mensal'] * 100) / 100,
        }
        for e in evaporacao
    ]

    print(json.dumps(resultado, ensure_ascii=False))
except Exception as e:
    print(json.dumps([]))
`;

  const scriptPath = path.join(__dirname, '.temp-evaporacao.py');
  fs.writeFileSync(scriptPath, pythonScript);

  try {
    const result = execSync(`python "${scriptPath}"`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
    });

    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  } catch {
    return [];
  } finally {
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }
  }
}

// ============================================================================
// GERAR HTML
// ============================================================================

function gerarHTML(data: CasoUsoData): string {
  const top3Custos = data.custosCongelados.slice(0, 3);
  const totalEvaporacao = data.evaporacao.reduce((sum, e) => sum + e.custoMensal, 0);

  // Calcular 3 números mais chocantes
  const numeros = [];
  if (top3Custos.length > 0) {
    numeros.push({
      label: 'Defasagem máxima',
      valor: `${top3Custos[0].defasagemPorcentagem.toFixed(1)}%`,
      descricao: `em "${top3Custos[0].nome}"`,
    });
  }
  if (data.margem && data.margem.gap.mensal > 0) {
    numeros.push({
      label: 'Margem perdida/mês',
      valor: `R$ ${Math.abs(data.margem.gap.mensal).toFixed(2)}`,
      descricao: `em "${data.margem.produto}"`,
    });
  }
  // Sempre renderizar métrica 3, com fallback se sem dados
  numeros.push({
    label: 'Evaporação mensal',
    valor: totalEvaporacao > 0 ? `R$ ${totalEvaporacao.toFixed(2)}` : 'N/A',
    descricao: totalEvaporacao > 0 ? 'saída não rastreada' : 'dados insuficientes',
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Caso de Uso - BatchFlow × Day Gruber</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a3a3a;
            background: #f5f7f7;
            padding: 40px 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #0d6b6b 0%, #1a9b9b 100%);
            color: white;
            padding: 60px 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.95;
        }

        .content {
            padding: 40px;
        }

        .section {
            margin-bottom: 50px;
        }

        .section-title {
            font-size: 1.8em;
            color: #0d6b6b;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #0d6b6b;
        }

        .data-grid {
            display: grid;
            gap: 20px;
        }

        .card {
            background: #f9fafb;
            border-left: 4px solid #0d6b6b;
            padding: 20px;
            border-radius: 6px;
        }

        .card-title {
            font-weight: 600;
            font-size: 1.1em;
            color: #1a3a3a;
            margin-bottom: 12px;
        }

        .card-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }

        .card-row:last-child {
            border-bottom: none;
        }

        .card-label {
            color: #666;
            font-size: 0.95em;
        }

        .card-value {
            font-weight: 600;
            color: #1a3a3a;
            text-align: right;
        }

        .highlight {
            background: #fff9e6;
            color: #cc7700;
        }

        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }

        .metric-card {
            background: linear-gradient(135deg, #f0f9f9 0%, #e0f2f1 100%);
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #0d6b6b;
        }

        .metric-value {
            font-size: 2.2em;
            font-weight: 700;
            color: #0d6b6b;
            margin-bottom: 8px;
        }

        .metric-label {
            font-size: 0.95em;
            color: #666;
            font-weight: 500;
        }

        .metric-desc {
            font-size: 0.85em;
            color: #999;
            margin-top: 8px;
        }

        .gap-section {
            background: #fff5e6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #cc7700;
        }

        .lacunas-section {
            background: #f3e5f5;
            padding: 20px;
            border-radius: 8px;
            margin-top: 40px;
            border-left: 4px solid #7b1fa2;
        }

        .lacunas-section h3 {
            color: #7b1fa2;
            margin-bottom: 15px;
            font-size: 1.3em;
        }

        .lacunas-list {
            list-style: none;
            padding-left: 0;
        }

        .lacunas-list li {
            padding: 10px 0;
            padding-left: 25px;
            position: relative;
            color: #555;
            border-bottom: 1px solid rgba(123, 31, 162, 0.2);
        }

        .lacunas-list li:before {
            content: "▸";
            position: absolute;
            left: 8px;
            color: #7b1fa2;
            font-weight: bold;
        }

        .lacunas-list li:last-child {
            border-bottom: none;
        }

        .footer {
            background: #f5f7f7;
            padding: 20px 40px;
            border-top: 1px solid #e5e7eb;
            font-size: 0.9em;
            color: #999;
            text-align: center;
        }

        @media (max-width: 768px) {
            .header {
                padding: 40px 20px;
            }

            .header h1 {
                font-size: 1.8em;
            }

            .content {
                padding: 20px;
            }

            .metric-grid {
                grid-template-columns: 1fr;
            }
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                border-radius: 0;
            }

            .header {
                page-break-after: avoid;
            }

            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Caso de Uso: BatchFlow</h1>
            <p>Análise de Custos e Margens — Day Gruber</p>
        </div>

        <div class="content">
            <!-- SEÇÃO 1: ERRO DO CUSTO CONGELADO -->
            <div class="section">
                <h2 class="section-title">1. Erro do Custo Congelado</h2>
                <p style="color: #666; margin-bottom: 20px;">Os insumos abaixo têm preço desatualizado há mais de 30 dias, causando margem incorreta.</p>

                ${top3Custos.length > 0 ? `
                <div class="data-grid">
                    ${top3Custos.map((custo, idx) => `
                    <div class="card">
                        <div class="card-title">${idx + 1}. ${custo.nome} ${custo.marca ? `(${custo.marca})` : ''}</div>
                        <div class="card-row">
                            <span class="card-label">Preço antiga compra (${custo.dataCompraAntiga.toISOString().split('T')[0]}):</span>
                            <span class="card-value">R$ ${custo.custoAntigoCompra.toFixed(2)}</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">Custo médio atual:</span>
                            <span class="card-value">R$ ${custo.custoMedioAtual.toFixed(2)}</span>
                        </div>
                        <div class="card-row highlight">
                            <span class="card-label"><strong>Defasagem:</strong></span>
                            <span class="card-value"><strong>+${custo.defasagemPorcentagem.toFixed(1)}%</strong> (R$ ${custo.defasagemReais.toFixed(2)})</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">Dias sem atualização:</span>
                            <span class="card-value">${custo.diasDesdeCompra} dias</span>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : `
                <div class="card">
                    <p style="color: #666;">Nenhum insumo com custo congelado > 5% foi detectado.</p>
                </div>
                `}
            </div>

            <!-- SEÇÃO 2: ANTES/DEPOIS -->
            <div class="section">
                <h2 class="section-title">2. Antes/Depois: Impacto na Margem</h2>
                ${data.bestSeller && data.margem ? `
                <p style="color: #666; margin-bottom: 20px;">Produto <strong>${data.bestSeller.nome}</strong> — best-seller com ${data.bestSeller.unidadesVendidas.toFixed(0)} unidades/mês.</p>

                <div class="card">
                    <div class="card-title">Análise de Margem</div>
                    <div class="card-row">
                        <span class="card-label">Preço de venda (por porção):</span>
                        <span class="card-value">R$ ${data.margem.precoVenda.toFixed(2)}</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Custo com preço antigo:</span>
                        <span class="card-value">R$ ${(data.margem.custoAntigo / 671).toFixed(2)}/porção</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Margem antiga:</span>
                        <span class="card-value">R$ ${data.margem.margemAntiga.r$.toFixed(2)} (${data.margem.margemAntiga.pct.toFixed(1)}%)</span>
                    </div>
                </div>

                <div class="card" style="margin-top: 15px;">
                    <div class="card-title">Com Custo Atual</div>
                    <div class="card-row">
                        <span class="card-label">Custo com preço atual:</span>
                        <span class="card-value">R$ ${(data.margem.custoAtual / 671).toFixed(2)}/porção</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Margem nova:</span>
                        <span class="card-value">R$ ${data.margem.margemNova.r$.toFixed(2)} (${data.margem.margemNova.pct.toFixed(1)}%)</span>
                    </div>
                    <div class="card-row highlight">
                        <span class="card-label"><strong>Gap:</strong></span>
                        <span class="card-value"><strong>-R$ ${Math.abs(data.margem.gap.r$).toFixed(2)}/porção</strong></span>
                    </div>
                </div>

                <div class="gap-section">
                    <strong>Impacto Mensal:</strong><br>
                    Com ${data.bestSeller.unidadesVendidas.toFixed(0)} porções vendidas/mês:<br>
                    <span style="font-size: 1.3em; color: #cc7700; font-weight: bold;">-R$ ${Math.abs(data.margem.gap.mensal).toFixed(2)}</span> em margem perdida por mês
                </div>
                ` : `
                <div class="card">
                    <p style="color: #666;">Dados insuficientes para calcular margem (best-seller ou ficha técnica não encontrados).</p>
                </div>
                `}
            </div>

            <!-- SEÇÃO 3: SAÍDA NÃO RASTREADA -->
            <div class="section">
                <h2 class="section-title">3. Saída Não Rastreada (Evaporação)</h2>
                ${data.evaporacao.length > 0 ? `
                <p style="color: #666; margin-bottom: 20px;">Insumos com saída superior à entrada registrada.</p>

                <div class="data-grid">
                    ${data.evaporacao.slice(0, 3).map((evap, idx) => `
                    <div class="card">
                        <div class="card-title">${idx + 1}. ${evap.nome}</div>
                        <div class="card-row">
                            <span class="card-label">Gap (entrada - saída):</span>
                            <span class="card-value">-${evap.gap.toFixed(2)}</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">Custo por unidade:</span>
                            <span class="card-value">R$ ${evap.custoDia.toFixed(2)}</span>
                        </div>
                        <div class="card-row highlight">
                            <span class="card-label"><strong>Custo mensal:</strong></span>
                            <span class="card-value"><strong>R$ ${evap.custoMensal.toFixed(2)}</strong></span>
                        </div>
                    </div>
                    `).join('')}
                </div>

                <div class="gap-section" style="margin-top: 20px;">
                    <strong>Total de Evaporação (Top 3):</strong><br>
                    <span style="font-size: 1.3em; color: #cc7700; font-weight: bold;">R$ ${data.evaporacao.slice(0, 3).reduce((sum, e) => sum + e.custoMensal, 0).toFixed(2)}/mês</span>
                </div>
                ` : `
                <div class="card">
                    <p style="color: #666;">Nenhuma saída não rastreada detectada.</p>
                </div>
                `}
            </div>

            <!-- SEÇÃO 4: SÍNTESE EM 3 NÚMEROS -->
            <div class="section">
                <h2 class="section-title">4. Os 3 Números Mais Chocantes</h2>
                <div class="metric-grid">
                    ${numeros.map((num) => `
                    <div class="metric-card">
                        <div class="metric-value">${num.valor}</div>
                        <div class="metric-label">${num.label}</div>
                        <div class="metric-desc">${num.descricao}</div>
                    </div>
                    `).join('')}
                </div>
            </div>

            <!-- SEÇÃO: LACUNAS -->
            <div class="lacunas-section">
                <h3>Status dos Dados</h3>
                ${data.lacunas.length > 0 ? `
                <ul class="lacunas-list">
                    ${data.lacunas.map(lacuna => `<li>${lacuna}</li>`).join('')}
                </ul>
                ` : `
                <ul class="lacunas-list">
                    <li style="color: #4caf50; border-bottom: none;">✅ Todos os dados foram processados com sucesso.</li>
                </ul>
                `}
            </div>
        </div>

        <div class="footer">
            <p>Relatório gerado em ${data.dataGeracao}</p>
            <p>BatchFlow — Inteligência em Produção</p>
        </div>
    </div>
</body>
</html>`;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    console.log('\n📊 Gerando caso de uso HTML...\n');

    const lacunas: string[] = [];
    const dataGeracao = new Date().toLocaleString('pt-BR');

    // TAREFA 1
    console.log('  [1/5] Extraindo custos congelados...');
    const custosCongelados = await extrairCustosCongelados();
    console.log(`       ✓ ${custosCongelados.length} insumos com custo congelado encontrados`);

    // TAREFA 2
    console.log('  [2/5] Extraindo produto mais vendido...');
    const bestSeller = await extrairProdutoMaisVendido();
    if (!bestSeller) {
      console.warn('Aviso: Nenhum best-seller foi encontrado na base de pedidos.');
      lacunas.push('Nenhum best-seller foi encontrado na base de pedidos.');
    } else {
      console.log(`       ✓ Best-seller: ${bestSeller.nome} (${bestSeller.unidadesVendidas.toFixed(0)} unidades/mês)`);
    }

    // TAREFA 4
    console.log('  [3/5] Calculando margens antes/depois...');
    let margem: ResultadoMargem | null = null;
    if (bestSeller) {
      // Procurar por FT baseado no nome do best-seller com fuzzy matching robusto
      margem = await calcularMargemAntesDepois(bestSeller.nome, bestSeller.unidadesVendidas);
      if (margem) {
        console.log(`       ✓ Margem calculada para: ${margem.produto}`);
      } else {
        console.warn(`Aviso: Ficha técnica do best-seller "${bestSeller.nome}" não encontrada.`);
        lacunas.push(`Ficha técnica do best-seller "${bestSeller.nome}" não encontrada (verifique se existe em FT.xlsx).`);
      }
    }

    // TAREFA 5
    console.log('  [4/5] Analisando saída não rastreada (evaporação)...');
    const evaporacao = await extrairEvaporacao();
    console.log(`       ✓ ${evaporacao.length} produtos com evaporação detectados`);

    // Montar dados
    const data: CasoUsoData = {
      custosCongelados,
      bestSeller,
      margem,
      evaporacao,
      dataGeracao,
      lacunas,
    };

    // Gerar HTML
    console.log('  [5/5] Gerando HTML...');
    const html = gerarHTML(data);

    // Salvar arquivo
    const outputPath = path.join(__dirname, 'casoUsoDay.html');
    fs.writeFileSync(outputPath, html, 'utf-8');

    console.log(`\n✅ Arquivo gerado com sucesso!\n`);
    console.log(`📄 Salvo em: ${outputPath}`);
    console.log(`\n📖 Para visualizar, abra no navegador:\n   file://${outputPath}\n`);

    // Resumo
    console.log('📊 RESUMO DO CASO DE USO:');
    console.log(`   • Top 3 Custos Congelados: ${custosCongelados.slice(0, 3).length}`);
    if (bestSeller) {
      console.log(`   • Best-seller: ${bestSeller.nome}`);
      console.log(`   • Volume mensal: ${bestSeller.unidadesVendidas.toFixed(0)} unidades`);
    }
    if (margem) {
      console.log(`   • Gap de margem: -R$ ${Math.abs(margem.gap.mensal).toFixed(2)}/mês`);
    }
    console.log(`   • Evaporação detectada: ${evaporacao.length} produtos`);
    if (evaporacao.length > 0) {
      const total = evaporacao.slice(0, 3).reduce((sum, e) => sum + e.custoMensal, 0);
      console.log(`   • Evaporação Top 3: R$ ${total.toFixed(2)}/mês`);
    }
    if (lacunas.length > 0) {
      console.log(`   • ⚠️  Lacunas encontradas: ${lacunas.length}`);
    }
  } catch (error) {
    console.error('\n❌ Erro ao gerar caso de uso:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
