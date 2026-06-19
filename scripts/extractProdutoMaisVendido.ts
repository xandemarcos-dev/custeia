import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

const execAsync = promisify(exec);

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

async function extractProdutoMaisVendido() {
  const excelPath = path.resolve(__dirname, '..', '..', 'Pedidos 2026.xlsx');

  // Validar existência do arquivo Excel
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

    if codigo and nome:
        codigo_int = int(codigo)
        produtos[str(codigo_int)] = str(nome)

# Ler Pedidos - Doces
sheet_pedidos = wb["Pedidos - Doces"]
vendas = {}
for row_idx in range(2, sheet_pedidos.max_row + 1):
    # Colunas: A=Pedido, F=Produto, H=Qtde, I=Unit, J=Total
    pedido = sheet_pedidos.cell(row=row_idx, column=1).value
    codigo_produto = sheet_pedidos.cell(row=row_idx, column=6).value
    qtde = sheet_pedidos.cell(row=row_idx, column=8).value
    preco_unit = sheet_pedidos.cell(row=row_idx, column=9).value
    total = sheet_pedidos.cell(row=row_idx, column=10).value

    # Ignorar linhas com dados incompletos
    if codigo_produto is None or qtde is None:
        continue

    codigo_str = str(int(codigo_produto))
    if codigo_str not in vendas:
        vendas[codigo_str] = {
            'unidades': 0,
            'valor': 0,
            'pedidos': set()
        }

    # Converter para número
    qtde_num = float(qtde) if qtde else 0
    total_num = float(total) if total else 0

    vendas[codigo_str]['unidades'] += qtde_num
    vendas[codigo_str]['valor'] += total_num

    # Adicionar pedido se houver (para contar pedidos únicos)
    if pedido is not None:
        vendas[codigo_str]['pedidos'].add(int(pedido))

# Converter sets para listas para serializar
resultado = {}
for codigo_str, venda_data in vendas.items():
    resultado[codigo_str] = {
        'unidades': venda_data['unidades'],
        'valor': venda_data['valor'],
        'numeroPedidos': len(venda_data['pedidos'])
    }

print(json.dumps({'produtos': produtos, 'vendas': resultado}))`;

  // Escrever e executar script Python com UUID para evitar race condition
  const randomSuffix = randomBytes(4).toString('hex');
  const tempPyPath = path.join(__dirname, '..', '..', `temp_venda_${randomSuffix}.py`);
  fs.writeFileSync(tempPyPath, pythonCode);

  try {
    const { stdout, stderr } = await execAsync(`python "${tempPyPath}"`);

    if (stderr) {
      console.warn('Python stderr:', stderr);
    }

    const data = JSON.parse(stdout);

    // Processar dados e criar lista de produtos vendidos
    const resultados: ProdutoVenda[] = [];

    for (const [codigoStr, venda] of Object.entries(data.vendas)) {
      const v = venda as {
        unidades: number;
        valor: number;
        numeroPedidos: number;
      };

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

    // Ordenar por unidades vendidas DESC
    resultados.sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);

    // Log dos top 5 e obter best-seller
    console.log('\n=== PRODUTO MAIS VENDIDO ===\n');

    const top5 = resultados.slice(0, 5);
    top5.forEach((item, index) => {
      console.log(
        `${index + 1}. ${item.nome} (Código: ${item.codigoProduto})`
      );
      console.log(`   Unidades vendidas: ${item.unidadesVendidas}`);
      console.log(`   Valor total: R$ ${item.valorTotal.toFixed(2)}`);
      console.log(`   Número de pedidos: ${item.numeroPedidos}`);
      console.log(
        `   Preço médio por unidade: R$ ${item.precoMedio.toFixed(2)}`
      );
      console.log();
    });

    // Retornar best-seller (produto #1)
    if (resultados.length > 0) {
      const bestSeller: BestSeller = {
        ...resultados[0],
        ranking: 1,
      };
      console.log('--- RESUMO ---');
      console.log(`Best-seller: ${bestSeller.nome}`);
      console.log(
        `Total de produtos únicos vendidos: ${resultados.length}`
      );
      console.log(
        `Total geral de unidades: ${resultados.reduce((sum, p) => sum + p.unidadesVendidas, 0)}`
      );
      console.log(
        `Total geral de vendas: R$ ${resultados.reduce((sum, p) => sum + p.valorTotal, 0).toFixed(2)}`
      );

      return bestSeller;
    }

    return null;
  } finally {
    // Limpar arquivo temporário
    if (fs.existsSync(tempPyPath)) {
      fs.unlinkSync(tempPyPath);
    }
  }
}

extractProdutoMaisVendido().catch(console.error);
