# Lacunas e Limitações — Caso de Uso Day Gruber

**Data:** 19/06/2026 | **Período de análise:** Dados importados de Estoque 2026.xlsx, FT.xlsx, Pedidos 2026.xlsx, Financeiro 2026.xlsx

---

## Resumo Executivo

### O que funciona ✅
- **Histórico de custos**: Consegui extrair e comparar preços antigos vs. novos (Entradas vs. Produtos)
- **Fichas técnicas**: Todas as receitas estão estruturadas em FT.xlsx com ingredientes mapeados
- **Vendas agregadas**: Aba "Pedidos - Doces" tem volume total por produto
- **Insumos com defasagem**: Identifiquei 3+ insumos com custo > 30 dias desatualizado
- **Best-seller**: "Tradicional ao Leite" com 671 unidades mapeadas

### O que NÃO funciona ❌
- **Saídas rastreadas**: Aba "Saídas" **completamente vazia** — impossível calcular evaporação real
- **Volume mensal real**: Dados de pedidos não têm datas claras — volume é estimativa (total/12)
- **Mão-de-obra**: Nenhuma coluna em FT.xlsx ou Financeiro para custo de produção
- **Gap de margem insignificante**: -R$ 0.35/mês no best-seller → números muito pequenos (problema nos dados, não no modelo)

---

## Dados Confirmados ✅

| Item | Status | O que foi extraído |
|------|--------|-------------------|
| **Histórico de custos (Entradas)** | SIM | Preço da compra original × data da entrada |
| **Custo médio atual (Produtos)** | SIM | Coluna de custo médio ponderado |
| **Fichas técnicas** | SIM | 5+ receitas com ingredientes + quantidades |
| **Rendimento (yieldQty)** | SIM | Gramas ou porções de cada produto |
| **Embalagem (packagingCost)** | SIM | Custo fixo por lote |
| **Pedidos / volume vendido** | SIM | Total de unidades por produto |
| **Preço de venda (unitPrice)** | SIM | Preço médio por unidade |
| **Insumos identificados** | SIM | 16+ insumos únicos com código e marca |

---

## Dados Faltando ❌

### 1. **Saídas Rastreadas (Aba "Saídas" vazia)**

**O que deveria ter:**
- Código do insumo
- Data da saída
- Quantidade saída
- Motivo: produção vs. perda vs. devolução vs. uso pessoal

**Por que importa:**
- Impossível calcular **evaporação de estoque** (quantidade comprada - saída registrada - saldo atual = gap)
- Não consigo separar "insumo que virou produto" de "insumo que desapareceu"
- Impacto financeiro: Day está pedindo para saber **quanto dinheiro some do caixa sem virar venda**

**Solução:**
- Pedir à Day: "Vocês rastreiam saídas de estoque em algum lugar? Planilha à parte? Sistema?"
- Se não rastreiam: sugerir que comecem (é onde está o dinheiro perdido)

---

### 2. **Datas de Pedidos Indefinidas**

**O que deveria ter:**
- Coluna de data clara em "Pedidos - Doces" (ex: 2026-06-15)
- OU período coberto pelos dados (ex: "jan-jun 2026")

**Por que importa:**
- Pedidos hoje estão agregados só por cliente/produto, sem cronologia
- Volume "mensal" é estimativa: `total_anual / 12` **não é real**
- Exemplo: "Tradicional ao Leite" tem 671 un no histórico, dividi por 12 = 55.9/mês, mas:
  - Pode ser que venderam 100/mês em jan-mar e 20/mês em abr-jun (sazonalidade invisível)
  - Pode ser que o histórico cobre só 6 meses, não 12

**Solução:**
- Pedir à Day: "Qual período essa planilha cobre? Há mais dados de outros períodos?"
- Adicionar coluna de data em "Pedidos - Doces"
- Confirmar: "Esses 671 são de 1 mês ou de 1 ano?"

---

### 3. **Custo de Mão-de-Obra / Overhead Ausente**

**O que deveria ter:**
- Em FT.xlsx: coluna adicional para **custo de produção** (mão-de-obra, energia, utensílios)
- OU em Financeiro: planilha separada com overhead mensal

**Por que importa:**
- Caso de uso hoje mostra só **insumo + embalagem**
- Margens calculadas ignoram: salário do padeiro, eletricidade do forno, desgaste de equipamento
- Verdadeiro CMV (Custo de Mercadoria Vendida) é: insumos + embalagem + **(overhead / volume mensal)**

**Exemplo real:**
- Tradicional ao Leite: custo hoje = R$ 0.04/porção (só insumos)
- Mas se mão-de-obra + overhead = R$ 500/mês ÷ 671 un = R$ 0.74/un
- Margem real: R$ 2.00 - (0.04 + 0.74) = R$ 1.22 **não R$ 1.96**

**Solução:**
- Pedir à Day: "Qual é o custo de produção mensal? (Salário, energia, etc.)"
- Se não sabe: usar estimativa (ex: "30% do faturamento" é padrão em confeitaria)

---

### 4. **Tamanho do Produto não Vinculado aos Pedidos**

**O que deveria ter:**
- Aba "Tamanho - Gr" tem nomes + tamanhos (ex: "Tradicional: 100g, 200g, 500g")
- Mas "Pedidos - Doces" não diz qual tamanho foi vendido

**Por que importa:**
- Número "671 unidades" pode ser:
  - 671 × 100g = 67.1 kg total
  - OU 671 × 500g = 335.5 kg total
  - Diferença ENORME no custo e na margem
- Rendimento da receita muda com tamanho (mais grande = menos margem %)

**Solução:**
- Adicionar coluna em "Pedidos - Doces": "Tamanho (gr)"
- Confirmar com Day qual tamanho é mais vendido

---

### 5. **Período não Confirma** (Bonus)

**Dados no HTML:**
- "Dias sem atualização: 166 dias" (última compra em jan/2026)
- Hoje é 19/06/2026, logo última compra foi ~12/01/2026

**Lacuna:**
- Por que 166 dias sem comprar esse insumo?
- Ele tá em estoque seguro?
- OU foi descontinuado?
- OU a data tá errada?

**Solução:**
- Confirmar com Day: "Esse insumo tá em falta há 5 meses?"

---

## Impactos por Lacuna

| Lacuna | Severidade | Impacto no Caso de Uso |
|--------|------------|------------------------|
| Saídas vazias | **ALTA** | Não consigo demonstrar evaporação → "3º número" tá N/A |
| Datas de pedidos | **ALTA** | Volume mensal é estimativa, não real → margem/mês pode estar errada |
| Mão-de-obra | **MÉDIA** | Margens ignoram overhead → caso de uso tá otimista |
| Tamanho × pedidos | **MÉDIA** | Volume em unidades, não em peso → receita pode ser 10x menor |
| Período desconhecido | **MÉDIA** | Não sei se dados são recentes ou estão obsoletos |

---

## Recomendações — Próximos Passos

### Antes da próxima conversa com Day (em 21/06):
1. **Confirmar período**: "Que datas cobrem os dados de 2026? Jan-Jun? Todo o ano?"
2. **Saídas rastreadas**: "Vocês rastreiam estoque que sai (exceto venda)? Onde fica esse dado?"
3. **Mão-de-obra**: "Quanto custa por mês para produzir? (Salário + energia)"
4. **Tamanho dos pedidos**: "Qual é o tamanho mais vendido do Tradicional ao Leite?"

### Se Day não tiver esse dados:
- **Não é problema.** Usar estimativas conservadoras:
  - Volume mensal: usar 50% do valor calculado (margem de segurança)
  - Mão-de-obra: usar 20-30% do faturamento (benchmarking confeitaria)
  - Saídas: assumir 5-10% de desperdício (padrão)

### Para aproveitar melhor os dados:
1. **Destacar a defasagem de custos** (53.7% no Marula) — esse é real e assustador
2. **Usar o número de insumos com problema** (16 congelados) — impacta todas as receitas
3. **Fazer análise "e se"**: "Se voltasse pro preço antigo, ganharia X/mês"
4. **Propor: "Vamos rastrear saídas juntos?"** — virar feature do BatchFlow, não problema

---

## Dados Extraídos com Sucesso 🎯

✅ **Top 3 Custos Congelados:**
1. Pasta Saborizante de Marula: +53.7% (R$ 192.70 → R$ 296.25)
2. Chocolate Meio Amargo: +43.2% (R$ 77.00 → R$ 110.23)
3. Coco Ralado: +19.7% (R$ 48.15 → R$ 57.63)

✅ **Best-seller:** Tradicional ao Leite (671 un total)

✅ **Fichas técnicas extraídas:** 5+ receitas completas

✅ **Gap calculado:** -R$ 0.35/mês (pequeno demais = sinal que dados estão incompletos)

---

## Status do Documento HTML Gerado

| Seção | Completude | Nota |
|-------|-----------|------|
| 1. Custo Congelado | ✅ 100% | 3 insumos extraídos com defasagem real |
| 2. Antes/Depois | ⚠️ 80% | Números calculados, mas gap muito pequeno |
| 3. Saídas Não Rastreada | ❌ 0% | Aba vazia → mostrar "N/A" honestamente |
| 4. Síntese 3 Números | ⚠️ 66% | Só 2 números reais (defasagem + gap) |

**Recomendação:** Usar o HTML como é, mas adicionar **rodapé explicativo** nas seções N/A.

---

## Conclusão

**O caso de uso é válido, mas incompleto.**

Consegui extrair:
- Custos congelados reais (excelente pra convencer)
- Best-seller e volume (bom pra contextualizar)
- FT completa (prova que os dados existem)

O que falta:
- Saídas (onde está o dinheiro que desaparece)
- Datas (para confirmar volume real)
- Overhead (para margens honestas)

**Próxima conversa:** Levar o HTML gerado + essa lista de lacunas. Day preenchendo os gaps = aumentar 10x o impacto da apresentação.

---

**Documento gerado:** 2026-06-19  
**Próxima revisão:** Após conversa com Day (2026-06-21)  
**Responsável:** BatchFlow × Day Gruber Case Study
