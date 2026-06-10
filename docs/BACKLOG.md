# BatchFlow — Backlog & Roadmap

Decisões registradas em 2026-06-08, com base na entrevista com a Day e nas
planilhas reais do André (`Estoque 2026.xlsx`, `FT.xlsx`, `Pedidos 2026.xlsx`,
`Financeiro 2026.xlsx`). Roteiro de validação: `docs/TEST-PLAN-CASO-REAL.md`.

---

## Roadmap (ordem de execução)

### 1. ✅ Validar a matemática com o caso real — EM ANDAMENTO
Rodar `TEST-PLAN-CASO-REAL.md` (Brigadeiro Ninho + Tradicional ao Leite) e
conferir contra o gabarito das planilhas. Pré-requisito de tudo abaixo.

### 2. 🔴 Produção com baixa automática de estoque (a peça que falta no ciclo)
Hoje o estoque só sobe (compras). Criar fluxo "Produzi N lotes da receita X"
→ baixa automática dos ingredientes da ficha técnica via `IngredientExit`
(`source='production'`, já previsto no schema; falta a UI).
**Evidência:** a aba Saídas da planilha foi *abandonada por falta de tempo*
(entrevista) — controle manual de saída comprovadamente não sobrevive.
Sem isso, estoque e Reposição viram ficção em semanas.

### 3. 🔴 Importador das planilhas (risco de adoção)
~300 insumos e ~70 fichas técnicas existentes. Se o onboarding for "redigite
tudo", a Day e o André desistem. Script de importação: insumos + custo médio
(aba Estoque/Produtos) e fichas técnicas (FT.xlsx) → banco do workspace.
Maior alavancagem para o teste real com os dois.

### 4. 🟠 Preço de venda sugerido (precificação reversa)
Na tela do produto: "para margem alvo de X%, venda a R$ Y". A planilha do
André já tem a coluna "Valor Venda Sugerido"; a dor nº 1 da entrevista é
"precificar de forma prática e segura". Substitui a ideia de calculadora
de domínio — a conta vai onde o usuário está, não num widget.

### 5. 🟡 Venda "por cento"
Pedidos 2026 precifica por unidade E por cento (ex: R$ 2,00/un = R$ 200/cento).
Exibir custo/preço por cento ao lado do por unidade nas telas de produto/margem.

### 6. 🟡 Fornecedor na compra
Schema já tem `Supplier`; planilha de Entradas tem a coluna. Adicionar campo
opcional de fornecedor na tela de Nova Compra (alimenta comparações futuras).

---

## Excluir

### Calculadora flutuante genérica (`CalculatorFab`)
**Decisão (2026-06-08): remover.** Construída para avaliar design, mas é
genérica e desligada do núcleo. O que ela deveria ser virou o item 4 do
roadmap (preço sugerido inline na tela do produto). Remover o componente
e a montagem no layout quando o item 4 for implementado (ou antes).

---

## Não fazer (decisão consciente)

- **Emissão de NF** — a própria Day declarou que não é prioridade (entrevista).
- **Gestão de pedidos/clientes** — planilha Pedidos existe, mas é outro produto;
  a dor nº 1 é custo/precificação. Não diluir o MVP.
- **Financeiro mensal** — idem.
- **FC (fator de correção) por ingrediente** — sempre 1 nas planilhas. YAGNI.
- **Mão de obra como custo separado** — já embutida nos 30% de custos fixos
  por receita (`fixedCostPct`), modelo que as FTs do André usam.

---

## Premium / futuro (construir quando houver dor real)

### Ponto de reposição (reorder point) — estoque com dois patamares
**Status:** adiado (2026-06-08). Boa ideia, hora errada.

Hoje o estoque tem **um** patamar (`minStockQty`). A ideia é ter **dois**:

- **Estoque mínimo** — a reserva de segurança (o "chão").
- **Ponto de reposição** — o nível que dispara a compra, *antes* de furar o
  mínimo (cobre o tempo de entrega do fornecedor). Regra: ponto ≥ mínimo.

Três zonas: 🔴 Crítico (estoque < mínimo) · 🟡 Repor (mínimo ≤ estoque ≤ ponto)
· ✅ OK (acima). Campo opcional `reorderPoint Decimal?` em `Ingredient`; se
vazio, comportamento atual. Tela de Reposição ganha coluna "Situação";
badge conta amarelo+vermelho.

**Por que adiar:** o ganho real vem do *lead time* do fornecedor — pequeno para
compra local. Candidato a **recurso de plano pago** ("inteligência de estoque").

### Embalagens como insumos consumíveis
Hoje embalagem é custo fixo por lote (`packagingCost`), igual às FTs do André.
A planilha de Estoque trata embalagens como itens com estoque (categoria
Embalagens, potes herméticos). Futuro: embalagem como insumo baixado por
unidade produzida. Só se houver dor real de controle de embalagem.

### Unidade de compra padrão por insumo
Na planilha, cada insumo tem seu "Volume" (395g, 200g, 1kg). No BatchFlow as
unidades são do workspace — com 300 insumos, o dropdown pode poluir. Futuro:
sugerir/fixar a unidade de compra padrão de cada insumo.

---

## Marca / Clerk
- Renomear a *aplicação* no painel do Clerk de "Rixan" para "BatchFlow"
  (cosmético; o login já mostra "BatchFlow" via override no código).
- Logo BatchFlow horizontal com fundo transparente para header e login.
