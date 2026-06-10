# BatchFlow — Backlog

Ideias e decisões adiadas conscientemente. Não é roadmap — é memória.

---

## Premium / futuro (construir quando houver dor real)

### Ponto de reposição (reorder point) — estoque com dois patamares
**Status:** adiado (2026-06-08). Boa ideia, hora errada.

Hoje o estoque tem **um** patamar (`minStockQty`). A ideia é ter **dois**:

- **Estoque mínimo** — a reserva de segurança (o "chão").
- **Ponto de reposição** — o nível que dispara a compra, *antes* de furar o mínimo (cobre o tempo de entrega do fornecedor). Regra: ponto de reposição ≥ mínimo.

Três zonas: 🔴 Crítico (estoque < mínimo) · 🟡 Repor (mínimo ≤ estoque ≤ ponto de reposição) · ✅ OK (acima).

Modelo: campo opcional `reorderPoint Decimal?` em `Ingredient`; se vazio, cai no comportamento atual (só o mínimo). Validar `reorderPoint >= minStockQty`. Tela de Reposição ganha coluna "Situação" com selo; badge do header conta amarelo+vermelho.

**Por que adiar:** o ganho real vem do *lead time* do fornecedor — pequeno para quem compra local. Adiciona dois campos no cadastro (fricção/confusão) para uma dor que a usuária atual ainda não tem. Forte candidato a **recurso de plano pago** ("inteligência de estoque") depois do produto validado.

---

## Dúvidas de escopo (candidatos a revisão / remoção)

### Calculadora flutuante (genérica)
Construída a pedido, mas é genérica e desligada do núcleo (custo/margem). Todo mundo já tem calculadora no celular/PC. Avaliar: **remover** ou **transformar em domínio-específica** (custo/g, conversão de unidade, margem reversa) — só então agrega.

---

## Marca / Clerk
- Renomear a *aplicação* no painel do Clerk de "Rixan" para "BatchFlow" (cosmético; o login já mostra "BatchFlow" via override no código).
- Logo BatchFlow horizontal com fundo transparente para header e login.
