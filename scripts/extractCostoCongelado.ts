import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

const execAsync = promisify(exec);

interface Produto {
  codigo: number;
  nome: string;
  marca: string;
  custoMedioAtual: number;
}

interface Entrada {
  codigo: number;
  data: Date;
  quantidade: number;
  precoUnitario: number;
}

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

async function extractCostoCongelado() {
  const excelPath = path.resolve(__dirname, '..', '..', 'Estoque 2026.xlsx');

  // Ponto 3: Validar existência do arquivo Excel
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Arquivo Excel não encontrado: ${excelPath}`);
  }

  // Criar script Python para extrair dados com valores calculados
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

  // Escrever e executar script Python com UUID para evitar race condition
  const randomSuffix = randomBytes(4).toString('hex');
  const tempPyPath = path.join(__dirname, '..', '..', `temp_extract_${randomSuffix}.py`);
  fs.writeFileSync(tempPyPath, pythonCode);

  try {
    const { stdout, stderr } = await execAsync(`python "${tempPyPath}"`);

    if (stderr) {
      console.warn('Python stderr:', stderr);
    }

    const data = JSON.parse(stdout);

    // Processar dados
    const resultados: CustoCongelado[] = [];
    const now = new Date();

    for (const [codigoStr, produto] of Object.entries(data.produtos)) {
      const p = produto as Produto;
      const entradasProduto = (data.entradas[codigoStr] || []) as Array<{
        data: string;
        precoUnitario: number;
        quantidade: number;
      }>;

      if (entradasProduto.length === 0) {
        continue;
      }

      // Converter datas ISO e ordenar
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

      // Filtrar: defasagem > 5% E dias >= 30
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

    // Ordenar por defasagem % DESC
    resultados.sort((a, b) => b.defasagemPorcentagem - a.defasagemPorcentagem);

    // Log dos top 3
    console.log('=== CUSTO CONGELADO ===\n');
    console.log(`Total de insumos analisados: ${Object.keys(data.produtos).length}`);
    console.log(`Insumos com custo congelado (defasagem > 5% + dias >= 30): ${resultados.length}\n`);

    const top3 = resultados.slice(0, 3);
    top3.forEach((item, index) => {
      console.log(`${index + 1}. ${item.nome} (${item.marca})`);
      console.log(`   Código: ${item.codigo}`);
      const dateStr = item.dataCompraAntiga.toISOString().split('T')[0];
      console.log(`   Custo antigo (${dateStr}): R$ ${item.custoAntigoCompra.toFixed(2)}`);
      console.log(`   Custo médio atual: R$ ${item.custoMedioAtual.toFixed(2)}`);
      console.log(`   Defasagem: R$ ${item.defasagemReais.toFixed(2)} (${item.defasagemPorcentagem.toFixed(1)}%)`);
      console.log(`   Dias desde compra: ${item.diasDesdeCompra}`);
      console.log();
    });

    return resultados;
  } finally {
    // Limpar arquivo temporário
    if (fs.existsSync(tempPyPath)) {
      fs.unlinkSync(tempPyPath);
    }
  }
}

extractCostoCongelado().catch(console.error);
