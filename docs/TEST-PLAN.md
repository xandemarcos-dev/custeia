# BatchFlow — Plano de Testes Manuais (QA)

Roteiro para validar o sistema antes/depois do uso real. Marque cada item.
Ambiente: `npm run dev` → http://localhost:3000.

Legenda de resultado: ✅ passou · ⚠️ passou com ressalva · ❌ falhou (anotar)

---

## 1. Acesso e autenticação

| # | Passo | Esperado | OK? |
|---|---|---|---|
| 1.1 | Janela anônima → `localhost:3000` | Redireciona para login **BatchFlow** (não "Rixan") | |
| 1.2 | Login com e-mail da allowlist (`alexandre…`/`daygruberdoces…`) | Entra em `/ingredientes`; usuário criado no banco | |
| 1.3 | Login com e-mail FORA da allowlist | Cai em `/sem-acesso`; usuário NÃO é criado | |
| 1.4 | Botão "Sair" em `/sem-acesso` | Volta ao login | |
| 1.5 | Logado, acessar `/sign-in` | Não quebra (rota pública) | |

## 2. Isolamento por workspace (anti-IDOR)

| # | Passo | Esperado | OK? |
|---|---|---|---|
| 2.1 | Logado, abrir `/insumos/<uuid-inexistente>/editar` | Página 404 (não erro cru) | |
| 2.2 | `/insumos/<uuid-inexistente>/compras` | 404 | |

## 3. Fluxo CORE de ponta a ponta (o mais importante)

> Use dados reais da Day. Este é o teste que prova o valor do produto.

| # | Passo | Esperado | OK? |
|---|---|---|---|
| 3.1 | **Insumos → Novo insumo**: cadastrar um insumo (categoria, unidade base `g`/`ml`/`un`) | Aparece na lista com estoque 0 e custo R$ 0,00 | |
| 3.2 | **Nova compra** desse insumo: qtd + **preço total pago** + frete | Prévia ao vivo mostra "Total" e "Custo efetivo /unidade" | |
| 3.3 | Registrar a compra | Estoque e custo médio do insumo são atualizados | |
| 3.4 | Registrar uma 2ª compra com preço diferente | Custo médio recalcula (média ponderada móvel) | |
| 3.5 | **Produtos → Nova receita**: montar uma ficha com os insumos | Custo do produto aparece calculado | |
| 3.6 | **Margem**: conferir margem do produto vs preço de venda | Margem coerente; abaixo do alvo fica em vermelho | |
| 3.7 | Decidir o preço com base na margem | (julgamento) o número faz sentido para a Day? | |

## 4. Unidades

| # | Passo | Esperado | OK? |
|---|---|---|---|
| 4.1 | `/unidades` | Mostra `g` (não `gr`), kg, ml, L, un, dúzia | |
| 4.2 | Criar unidade com nome existente (ex: `kg`) | Bloqueia: "Já existe uma unidade chamada…" | |
| 4.3 | Editar unidade EM USO | Fator/base bloqueados; só nome editável | |
| 4.4 | Criar unidade nova e editá-la | Fator/base liberados; botão Excluir presente | |

## 5. Compras / Simulador (preço total)

| # | Passo | Esperado | OK? |
|---|---|---|---|
| 5.1 | Simulador: insumo + Fornecedor A (qtd, preço total, frete) | Prévia "/unidade" coerente (ex: 100 un por R$10 +R$1 = R$0,11/un) | |
| 5.2 | Simulador com Fornecedor B mais barato | Cartão B marcado "mais barato"; impacto na margem | |
| 5.3 | Dropdown de unidade filtra pela dimensão do insumo | Insumo de massa só mostra unidades de massa | |
| 5.4 | Editar uma compra existente | Campo "Preço total" pré-preenchido; recalcula ao salvar | |

## 6. Reposição

| # | Passo | Esperado | OK? |
|---|---|---|---|
| 6.1 | Definir estoque mínimo num insumo e deixar estoque abaixo | Aparece em `/reposicao`; badge no header conta | |
| 6.2 | Repor (comprar) até atingir o mínimo | Item SAI da lista; badge zera (regra: alerta só ABAIXO do mínimo) | |

## 7. Geral / regressão

| # | Passo | Esperado | OK? |
|---|---|---|---|
| 7.1 | Header mostra "BatchFlow"; título da aba idem | | |
| 7.2 | Navegar por todas as abas sem erro | Insumos, Produtos, Margem, Simular, Unidades, Reposição | |
| 7.3 | (Opcional) Calculadora flutuante abre/fecha | | |

---

## Isolamento multi-tenant (verificação forte, opcional)

Requer um 2º workspace de teste. Sob demanda, o dev cria um workspace + dados
e confirma que o usuário da Day **não** enxerga nada do outro. Removido depois.

---

## Bugs encontrados (anotar aqui)

- …
