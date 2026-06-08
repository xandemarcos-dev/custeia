# Multi-tenancy — Estágio 1 (base segura)

**Data:** 2026-06-07
**Projeto:** RIXAN (Saas/)
**Status:** Design aprovado — aguardando revisão do spec

---

## 1. Contexto e problema

Hoje o RIXAN opera como **single-tenant de fato**, sem isolamento real:

- **Não existe `middleware.ts`** → nenhuma rota é protegida. Qualquer pessoa com a URL acessa qualquer página.
- **Não há sincronização Clerk → banco** → ao logar pelo Clerk, nada é gravado na tabela `users` (ela está vazia). O Clerk `userId` (`user_xxx`) é diferente do `User.id` (UUID do banco).
- **Todas as leituras ignoram o workspace** → `prisma.ingredient.findMany()` etc. retornam tudo.
- As actions de criação "adivinham" o `workspaceId` a partir da entidade-pai (categoria/insumo) ou usam `findFirstOrThrow` no único workspace existente.

Existe 1 workspace (`Day Gruber Doces`), criado pelo seed com `ownerId` fake (`00000000-...`).

## 2. Objetivos

1. **Proteger todas as rotas** (exceto login) via middleware do Clerk.
2. **Vincular o usuário do Clerk ao banco** de forma confiável (coluna `clerkId`).
3. **Provisionar o usuário no primeiro acesso** (just-in-time), vinculando-o ao workspace existente, com **allowlist de e-mails** como trava de segurança.
4. **Filtrar todas as queries por workspace** (leitura e escrita), via um helper único.
5. Não quebrar nada do fluxo atual da Day.

## 3. Não-objetivos (ficam para o estágio SaaS)

- Criação automática de workspace no signup.
- Convites / gestão de equipe / múltiplos usuários por empresa via UI.
- Gerenciador de usuários e acessos premium (encaixará no enum `Plan` já existente).
- Billing.

> **Decisões tomadas no brainstorming:** modelo "1 negócio agora, SaaS depois"; novo login entra no workspace da Day; sincronização just-in-time.

---

## 4. Mudanças no modelo de dados

### 4.1 Coluna `clerkId` em `User`

```prisma
model User {
  id          String   @id @default(uuid())
  clerkId     String   @unique @map("clerk_id")   // NOVO
  email       String   @db.VarChar(255)
  name        String   @db.VarChar(100)
  role        Role     @default(owner)
  workspaceId String   @map("workspace_id")
  createdAt   DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id])

  @@map("users")
}
```

Migração: como a tabela `users` está vazia, adicionar a coluna `NOT NULL UNIQUE` é seguro (sem dados para violar). Migration criada manualmente (mesmo padrão dos arquivos existentes) e aplicada com `prisma migrate deploy` (não-interativo, banco Neon).

### 4.2 `ownerId` do workspace

No primeiro acesso de um usuário com `role=owner`, se o workspace ainda tiver `ownerId` fake, atualiza para o `clerkId` do owner. Ajuste de coerência, não bloqueante.

---

## 5. Componentes novos

### 5.1 `src/middleware.ts` — proteção de rotas

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|webp|woff2?)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

Sem login, `auth.protect()` redireciona para o login do Clerk.

### 5.2 `src/lib/workspace.ts` — resolução de tenant (o coração)

Função única usada por **todo** page/action que toca dados do tenant:

```ts
export async function requireWorkspaceId(): Promise<string>
```

Lógica:

1. `auth()` → pega `clerkUserId`. Se ausente → erro (middleware já barra antes).
2. Busca `User` por `clerkId`.
   - **Existe** → retorna `user.workspaceId`.
   - **Não existe** (primeiro acesso) → provisionamento JIT:
     a. `currentUser()` → obtém e-mail principal e nome.
     b. Verifica e-mail contra **allowlist** (`ALLOWED_EMAILS`, env, separada por vírgulas, case-insensitive).
        - Não autorizado → lança erro de acesso (página "sem acesso" / redireciona).
        - Autorizado → resolve o **workspace alvo** (o existente, via o mais antigo / único) e cria o `User { clerkId, email, name, workspaceId, role }`. Se for o primeiro owner, corrige o `ownerId` do workspace.
     c. Retorna o `workspaceId`.

Detalhes:
- Resolução do workspace alvo no estágio 1: `prisma.workspace.findFirstOrThrow({ orderBy: { createdAt: "asc" } })`.
- A allowlist vazia/ausente → **bloqueia todos** (fail-safe), com log claro de configuração faltante.
- Concorrência: criação do `User` usa `upsert` por `clerkId` para evitar corrida em requisições paralelas.

**Allowlist inicial** (`.env` → `ALLOWED_EMAILS`):

```
ALLOWED_EMAILS=alexandre.marcos60@gmail.com,daygruberdoces@gmail.com
```

### 5.3 Página de login própria

Decisão: **página de login própria** com a identidade do RIXAN (não o portal hospedado).

- `src/app/sign-in/[[...sign-in]]/page.tsx` → componente `<SignIn />` do Clerk, dentro do layout/branding do RIXAN (logo, cores `#182131`).
- `src/app/sign-up/[[...sign-up]]/page.tsx` → componente `<SignUp />` (opcional; pode apontar para o mesmo fluxo).
- `.env`: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` (e `..._SIGN_UP_URL=/sign-up`) para o `auth.protect()` redirecionar para a página própria.
- Ambas já estão no matcher público do middleware (seção 5.1).
- O `Header` pode manter o `SignInButton` ou linkar para `/sign-in`.

### 5.4 Página "sem acesso"

`src/app/sem-acesso/page.tsx` — mensagem amigável quando o e-mail não está na allowlist (com botão de sair). Fica protegida por login, mas acessível a usuários logados sem vínculo. O `requireWorkspaceId` redireciona para cá ao bloquear.

---

## 6. Aplicação do filtro por workspace

Padrão: cada page/action chama `const workspaceId = await requireWorkspaceId();` e usa em `where`/`data`.

### 6.1 Leituras (pages) — adicionar `where: { workspaceId }`

| Arquivo | Query |
|---|---|
| `app/ingredientes/page.tsx` | ingredient.findMany |
| `app/simulador/page.tsx` | ingredient.findMany, unit.findMany |
| `app/entradas/nova/page.tsx` | ingredient.findMany, unit.findMany |
| `app/insumos/novo/page.tsx` | category.findMany, unit.findMany |
| `app/insumos/[id]/compras/page.tsx` | ingredient.findUnique (+ validar workspace) |
| `app/insumos/[id]/compras/[entryId]/editar/page.tsx` | ingredientEntry.findUnique, unit.findMany |
| `app/insumos/[id]/editar/page.tsx` | ingredient.findUnique, category.findMany, unit.findMany |
| `app/receitas/page.tsx` | recipe.findMany |
| `app/receitas/nova/page.tsx` | productCategory.findMany, ingredient.findMany |
| `app/receitas/[id]/editar/page.tsx` | recipe.findUnique, productCategory.findMany, ingredient.findMany |
| `app/margem/page.tsx` | recipe.findMany |
| `app/reposicao/page.tsx` | ingredient.findMany |
| `app/unidades/page.tsx` | unit.findMany |
| `app/unidades/[id]/editar/page.tsx` | unit.findUnique, ingredient.count, ingredientEntry.count |
| `components/Header.tsx` | ingredient.findMany (contador de reposição) |

> **Acesso por ID** (`findUnique({ where: { id } })`): após buscar, validar que `registro.workspaceId === workspaceId`; senão `notFound()`. Evita IDOR (acessar registro de outro tenant pela URL).

### 6.2 Escritas (actions) — usar `requireWorkspaceId` + escopo

| Arquivo | Mudança |
|---|---|
| `app/insumos/novo/actions.ts` | usar helper em vez de derivar da categoria |
| `app/insumos/[id]/editar/actions.ts` | validar workspace do insumo antes de update/delete |
| `app/entradas/nova/actions.ts` | usar helper; validar insumo do mesmo workspace |
| `app/simulador/actions.ts` | usar helper nas queries |
| `app/receitas/nova/actions.ts` | usar helper em vez de derivar da categoria |
| `app/receitas/[id]/editar/actions.ts` | validar workspace da receita |
| `app/insumos/[id]/compras/actions.ts` | validar workspace da entrada |
| `app/unidades/nova/actions.ts` | usar helper em vez de `findFirstOrThrow` |
| `app/unidades/[id]/editar/actions.ts` | validar workspace da unidade |

### 6.3 Serviços

- `services/registerIngredientEntry.ts` já recebe `workspaceId` por parâmetro → garantir que o caller passe o do helper.
- `services/recomputeIngredient.ts` opera por `ingredientId` → garantir que o caller valide o workspace do insumo antes.

---

## 7. Edge cases

| Caso | Tratamento |
|---|---|
| Usuário logado sem `User` no banco (1º acesso) | Provisionamento JIT (allowlist). |
| E-mail fora da allowlist | Redireciona para `/sem-acesso`; não cria `User`. |
| `ALLOWED_EMAILS` ausente/vazio | Bloqueia todos (fail-safe) + log de aviso. |
| Acesso a registro de outro workspace por ID na URL | `notFound()` (checagem `workspaceId`). |
| Requisições paralelas no 1º acesso | `upsert` por `clerkId` evita duplicar `User`. |
| Múltiplos e-mails no Clerk | Usa o e-mail primário; se não houver, bloqueia. |
| Logout/troca de conta | `requireWorkspaceId` reavalia a cada request. |
| Seed/scripts (sem sessão) | Continuam recebendo `workspaceId` explícito; não usam o helper. |

---

## 8. Estratégia de testes

- **Unitário (vitest):** lógica pura da allowlist — `isEmailAllowed(email, envValue)` (parsing, trim, case-insensitive, vazio→false). Extraída para função pura testável.
- **Unitário:** resolução de "workspace alvo" e decisão de provisionamento (mockando prisma/clerk) — opcional, se o custo de mock valer.
- **Manual (com 2 workspaces de teste):** criar um segundo workspace + usuário e confirmar que cada um só enxerga seus dados (isolamento) e que IDs cruzados dão `notFound`.
- **Regressão:** `npx tsc --noEmit` + `npx vitest run` (suíte atual: 25 testes) devem continuar verdes.

---

## 9. Sequência de implementação (alto nível)

1. Migration `clerkId` + `prisma generate`.
2. `src/lib/workspace.ts` + `isEmailAllowed` (com teste) + `/sem-acesso`.
3. Páginas próprias `/sign-in` e `/sign-up` (com branding RIXAN) + envs `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`..._SIGN_UP_URL`.
4. `src/middleware.ts` + variável `ALLOWED_EMAILS` no `.env`.
5. Aplicar helper nas **actions** (escrita) — ponto de maior risco de integridade.
6. Aplicar filtro nas **pages** (leitura) + checagens de IDOR por ID.
7. `Header.tsx` (contador).
8. `tsc` + `vitest` + verificação manual de isolamento.

---

## 10. Relação com "Unidades — Fase 2"

A Fase 2 das Unidades (migrar `baseUnit` string → enum `Dimension` + `isBase`, proteger bases canônicas, badges de dimensão) é **independente** deste spec. Será tratada em spec/plano próprio para manter cada mudança focada. Pode ser implementada logo após, reusando o helper de workspace já pronto.

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Esquecer de filtrar uma query → vazamento entre tenants | Checklist item-a-item da seção 6; revisão; teste de isolamento manual. |
| `auth.protect()` redirecionar errado sem página de login dedicada | Validar config do Clerk (`CLERK_SIGN_IN_URL`); usar portal hospedado se não houver página. |
| Quebrar o fluxo da Day durante a transição | Allowlist inclui o e-mail da Day e o seu desde o início; testar login real antes de concluir. |
| Migration em produção (Neon) | `migrate deploy` não-interativo; tabela `users` vazia torna a coluna segura. |
