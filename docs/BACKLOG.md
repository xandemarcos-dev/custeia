# BatchFlow — Backlog & Roadmap

Decisões registradas em 2026-06-08, com base na entrevista com a Day e nas
planilhas reais do André (`Estoque 2026.xlsx`, `FT.xlsx`, `Pedidos 2026.xlsx`,
`Financeiro 2026.xlsx`). Roteiro de validação: `docs/TEST-PLAN-CASO-REAL.md`.

---

## Roadmap (ordem de execução)

### 1. ✅ Validar a matemática com o caso real — CONCLUÍDO (2026-06-10)
Rodado `TEST-PLAN-CASO-REAL.md` (Brigadeiro Ninho + Tradicional ao Leite):
todas as etapas batem com o gabarito das planilhas. Correção aplicada em
`src/services/margin.ts` (fixos incidem sobre insumos + embalagem) com os
dois produtos da Day como testes de regressão.

### 2. ✅ Produção com baixa automática de estoque — CONCLUÍDO (2026-06-11)
Tela `/producao/nova` cria N `IngredientExit` (`source='production'`) por lote
numa transação e debita o estoque dos insumos da ficha — sem mexer no
`avgCost` (regra de ouro: só muda em entrada). Soma o mesmo insumo quando
aparece em vários grupos (caso La Petite) e bloqueia se faltar estoque.
Validado com o Brigadeiro Ninho: estoques caíram exatamente 395 / 200 / 20
/ 50 g e o custo médio ficou intacto.
**Evidência:** a aba Saídas da planilha foi *abandonada por falta de tempo*
(entrevista) — controle manual de saída comprovadamente não sobrevive.
Sem isso, estoque e Reposição viram ficção em semanas.

### 3. ✅ Importador das planilhas — CONCLUÍDO (2026-06-11)
`scripts/importDay.ts`: lê `Estoque 2026.xlsx` + `FT.xlsx`, importa 174
insumos (com custo médio correto por g), 82 saldos iniciais e 66 receitas
com grupos Massa/Cobertura. Idempotente + `--dry-run`. Inclui
`resetWorkspace.ts` para ciclos de teste. Planilha do André: pendente até
receber o arquivo — reaproveita ~80% do código, só muda o mapa de colunas.

### 4. ✅ Preço de venda sugerido — CONCLUÍDO (2026-06-11)
Na tela do produto: "para margem alvo de X%, venda a R$ Y". A planilha do
André já tem a coluna "Valor Venda Sugerido"; a dor nº 1 da entrevista é
"precificar de forma prática e segura". Substitui a ideia de calculadora
de domínio — a conta vai onde o usuário está, não num widget.

### 5. ✅ Venda "por cento" — CONCLUÍDO (2026-06-11)
Coluna "Preço/cento" (preço/un × 100) nas telas Produtos e Margem,
em estilo secundário ao lado do preço por unidade.

### 6. ✅ Fornecedor na compra — CONCLUÍDO (2026-06-11)
Campo opcional "Fornecedor" na tela de Nova Compra com autocomplete
(datalist). Cria o `Supplier` automaticamente no primeiro uso — sem tela
de cadastro separada. Alimenta `supplierId` em `IngredientEntry` para
comparações futuras.

### 7. 🟢 Manual do sistema (quando o produto estiver pronto)
Documentar cada módulo e cada funcionalidade para a Day e o André conseguirem
operar sem suporte. Cobertura mínima: Unidades, Insumos, Compras, Produtos
(receitas + grupos), Produção, Margem, Simulador, Reposição. Em cada um:
o que é, quando usar, exemplo concreto da rotina deles, regras invisíveis
(ex.: a "regra de ouro" do custo médio só mudar em compra). Formato: páginas
dentro do app (`/ajuda/...`) com prints, não PDF — fica indexável e
atualizável junto com o código. Fazer **depois** do roadmap fechar para não
documentar tela que ainda vai mudar.

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
