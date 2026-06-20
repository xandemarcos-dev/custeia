import { execSync } from 'child_process';
import path from 'path';

async function analisarSaidaNaoRastreada(): Promise<void> {
  const pythonScript = `
import pandas as pd
import json
from pathlib import Path

file_path = Path("../Estoque 2026.xlsx")
print(f"\\nLendo: {file_path.resolve()}\\n")

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
# Gap = Entrada - Saída - Estoque
# Como não temos "Estoque Atual" via fórmula (seria preciso recalc),
# assumimos: Gap = Entrada - Saída (o que entrou mas não saiu)
# Se Gap < 0, há mais saída que entrada (consumo maior = evaporação negativa)
# Se Gap > 0, há mais entrada que saída (produto em estoque)

evaporacao = []

for codigo, entrada_total in entrada_por_codigo.items():
  saida_total = saida_por_codigo.get(codigo, 0)

  if codigo in produtos:
    nome = produtos[codigo]['nome']
    custo_dia = produtos[codigo]['custo_dia']

    # Gap positivo = entrada > saída (está em estoque)
    # Gap negativo = saída > entrada (mais saiu do que entrou - evaporação)
    gap = entrada_total - saida_total

    if gap < 0:  # Evaporação: saída maior que entrada
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

# Output
print("=== SAÍDA NÃO RASTREADA (EVAPORAÇÃO) ===\\n")
print(f"Resumo de dados:")
print(f"  - Entradas registradas: {len(entrada_por_codigo)} códigos com movimentação")
print(f"  - Saídas registradas: {saida_count} linhas de saída")
print(f"  - Produtos com evaporação: {len(evaporacao)}\\n")

if len(evaporacao) == 0:
  if saida_count == 0:
    print("AVISO: Nenhuma saída foi registrada na aba 'Saidas'!")
    print("A análise só é válida quando há saídas (receitas) registradas.\\n")
  else:
    print("Nenhuma evaporação detectada!")
    print("(Todos os produtos têm: Entrada >= Saída)\\n")

  # Mostrar amostra de como estão os dados
  print("Amostra dos 5 primeiros produtos com entradas:\\n")
  count = 0
  for codigo in sorted(entrada_por_codigo.keys())[:10]:
    entrada_total = entrada_por_codigo[codigo]
    saida_total = saida_por_codigo.get(codigo, 0)
    gap = entrada_total - saida_total
    nome = produtos.get(codigo, {}).get('nome', f'Produto {codigo}')
    print(f"  {codigo}. {nome}")
    print(f"     Entrada: {entrada_total:.2f} | Saída: {saida_total:.2f} | Gap (Entrada-Saída): {gap:.2f}")
    count += 1

else:
  top5 = evaporacao[:5]
  print("TOP 5 - Maior evaporação (R$/mês):\\n")

  for idx, item in enumerate(top5, 1):
    print(f"{idx}. {item['nome']} (código: {item['codigo']})")
    print(f"   Entrada registrada: {item['entrada']:.2f}")
    print(f"   Saída registrada: {item['saida']:.2f}")
    print(f"   Gap (Saída - Entrada): {item['gap_abs']:.2f} unidades")
    print(f"   Custo/unidade: R$ {item['custo_dia']:.2f}")
    print(f"   Custo/mês estimado: R$ {item['custo_mensal']:.2f}")
    print()

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

print("\\n=== JSON RESULTADO ===")
print(json.dumps(resultado, ensure_ascii=False, indent=2))
`;

  const scriptPath = path.join(__dirname, '.temp-evaporacao.py');
  require('fs').writeFileSync(scriptPath, pythonScript);

  try {
    execSync(`python "${scriptPath}"`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
  } finally {
    if (require('fs').existsSync(scriptPath)) {
      require('fs').unlinkSync(scriptPath);
    }
  }
}

analisarSaidaNaoRastreada().catch(console.error);
