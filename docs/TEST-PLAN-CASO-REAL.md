# BatchFlow — Roteiro de Teste com Caso Real (dados da Day)

Fonte: planilhas reais `Estoque 2026.xlsx`, `FT.xlsx`, `Pedidos 2026.xlsx`.
Objetivo: reproduzir no BatchFlow o **Brigadeiro Ninho** e o **Tradicional ao Leite**
e conferir se o custo/margem calculado **bate com a planilha da Day**.

> Por que esses dois: são receitas simples, com poucos insumos, e a planilha
> traz o custo esperado — então temos **gabarito** para validar a matemática.

---

## Etapa 0 — Unidades (pré-requisito)

Em **Unidades → Nova unidade**, criar as embalagens reais:

| Nome | Base | Fator | Por quê |
|---|---|---|---|
| `caixa 395g` | g | 395 | Leite Condensado vem em caixa de 395 g |
| `caixa 200g` | g | 200 | Creme de Leite 17% vem em caixa de 200 g |

(`g`, `kg`, `ml`, `L`, `un`, `dúzia` já existem.)

✅ Verificar: dropdown de "Nova compra" passa a oferecer as caixas para insumos de massa.

---

## Etapa 1 — Insumos (Insumos → Novo insumo)

| Insumo | Marca | Categoria | Unidade base |
|---|---|---|---|
| Leite Condensado | Frimesa | Laticínios | g |
| Creme de Leite 17% | Amanhecer/Santa Clara | Laticínios | g |
| Manteiga | Frimesa | Laticínios | g |
| Chocolate em Pó 50% | Sicao/Melken | Chocolates | g |
| Leite Ninho | Nestlé | Laticínios | g |
| Vermicelli ao Leite | — | Chocolates | g |

✅ Cada um nasce com estoque 0 e custo R$ 0,00.

## Etapa 2 — Compras (Nova compra) — preços reais da planilha

> Lembrete: o campo é **Preço total pago** (o valor dos itens, sem frete).

| Insumo | Unidade | Qtd | Preço total | Custo efetivo esperado |
|---|---|---|---|---|
| Leite Condensado | caixa 395g | 10 | R$ 55,00 | **R$ 0,013924/g** (5,50/caixa) |
| Creme de Leite 17% | caixa 200g | 10 | R$ 23,00 | **R$ 0,0115/g** (2,30/caixa) |
| Manteiga | kg | 1 | R$ 43,00 | **R$ 0,043/g** |
| Chocolate em Pó 50% | kg | 1 | R$ 42,00 | **R$ 0,042/g** |
| Leite Ninho | kg | 1 | R$ 48,30 | **R$ 0,0483/g** |
| Vermicelli ao Leite | kg | 1 | R$ 115,70 | **R$ 0,1157/g** |

✅ Conferir a prévia ao vivo antes de salvar e o custo médio na lista de insumos depois.

## Etapa 3 — Receita 1: Brigadeiro Ninho (Produtos → Nova receita)

Config (da FT real): rendimento **28** porções (16 g) · preço de venda **R$ 2,00** ·
embalagem **R$ 4,48** (por lote) · custos fixos **30%** · margem alvo sugerida **50%**.

Ingredientes (em gramas):

| Insumo | Qtd (g) | Custo esperado |
|---|---|---|
| Leite Condensado | 395 | R$ 5,50 |
| Creme de Leite 17% | 200 | R$ 2,30 |
| Manteiga | 20 | R$ 0,86 |
| Leite Ninho | 50 | R$ 2,415 |
| **Total ingredientes** | | **R$ 11,075** |

### Gabarito (planilha da Day)

- Custo do lote c/ embalagem: 11,075 + 4,48 = **R$ 15,555**
- Com 30% fixos: 15,555 × 1,30 = **R$ 20,22**
- **Custo por unidade: R$ 0,7222**
- Venda R$ 2,00 → **lucro/un R$ 1,2778** (margem ≈ **63,9%**)

✅ O BatchFlow deve chegar nesses números (tela do produto + tela Margem).
❌ Se divergir, anotar exatamente qual número e quanto.

## Etapa 4 — Receita 2: Tradicional ao Leite (testa GRUPOS)

Config: rendimento **32** porções (14 g) · venda **R$ 2,00** · embalagem **R$ 5,12** · fixos **30%** · margem alvo **50%**.

> Margem alvo de 50% é proposital: a margem real (~41%) deve ficar ABAIXO do alvo
> e aparecer em VERMELHO — este é o produto que a Day citou na entrevista como
> "vendido abaixo do ideal". Se o sistema acusar, provou o valor central.

Grupo "Massa":

| Insumo | Qtd (g) |
|---|---|
| Leite Condensado | 395 |
| Creme de Leite 17% | 200 |
| Manteiga | 20 |
| Chocolate em Pó 50% | 30 |

Grupo "Cobertura":

| Insumo | Qtd (g) |
|---|---|
| Vermicelli ao Leite | 120 |

### Gabarito

- Ingredientes: 9,92 (massa) + 13,884 (cobertura) = **R$ 23,804**
- + embalagem 5,12 = 28,924 · ×1,30 = **R$ 37,60**
- **Custo por unidade: R$ 1,1750** · venda R$ 2,00 → margem ≈ **41,2%** (lucro/un R$ 0,825)

> Este é o produto que a Day citou na entrevista como "vendido abaixo do ideal" —
> ótimo caso para o BatchFlow *provar valor* mostrando a margem apertada.

## Etapa 5 — Simulador com decisão real

Cenário: Leite Condensado subiu. Comparar:
- Fornecedor A: 10 caixas 395g por R$ 60,00 (R$ 6,00/caixa)
- Fornecedor B: 10 caixas 395g por R$ 55,00 + frete R$ 8,00

✅ Esperado: B efetivo R$ 0,01595/g vs A R$ 0,01519/g → **A mais barato** (o frete come a vantagem).
✅ Tabela de impacto na margem deve listar as duas receitas criadas.

## Etapa 6 — Reposição

- Definir estoque mínimo do Leite Condensado: **3.950 g** (10 caixas).
- Como o estoque está em 3.950 g (compra da etapa 2), **não** deve alertar.
- Editar mínimo para 5.000 g → deve aparecer em Reposição (faltam 1.050 g) e badge = 1.

---

## Critérios de aceite do caso real

1. Custos por unidade batem com a planilha (tolerância de centavos por arredondamento).
2. A Day consegue fazer o fluxo inteiro **sem ajuda** (teste com ela depois).
3. Tempo para cadastrar 1 receita completa < 10 min.

## Lacunas conhecidas vs planilha da Day (anotar impressões, não corrigir agora)

- A planilha tem **custos fixos %** e **custo de embalagem** por receita — o BatchFlow já tem ambos (conferir nesta rodada).
- A planilha vende por **cento** (Valor Cento) — BatchFlow mostra por unidade; avaliar se faz falta.
- A planilha tem **FC (fator de correção)** por ingrediente (hoje sempre 1) — ignorar por ora.
- Produção/baixa de estoque ao produzir (item 6 do MVP da entrevista) — ainda não existe no BatchFlow; é a próxima grande peça depois da validação.
