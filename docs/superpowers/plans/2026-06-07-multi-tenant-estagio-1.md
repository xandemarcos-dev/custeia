# Multi-tenancy Estágio 1 — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Isolar dados por workspace no RIXAN — proteger rotas, vincular usuário do Clerk ao banco (just-in-time com allowlist) e filtrar todas as queries por workspace.

**Architecture:** Um helper único `requireWorkspaceId()` resolve o tenant do request (a partir do `clerkId`, provisionando o `User` no 1º acesso). Middleware do Clerk protege todas as rotas. Cada page/action passa a filtrar por `workspaceId`. Acesso por ID valida o workspace (anti-IDOR).

**Tech Stack:** Next.js 16 (App Router), Clerk `@clerk/nextjs` ^7.4.3, Prisma 7 (PostgreSQL/Neon), vitest.

**Spec:** `docs/superpowers/specs/2026-06-07-multi-tenant-estagio-1-design.md`

---

## Estrutura de arquivos

**Criar:**
- `prisma/migrations/<ts>_user_clerk_id/migration.sql` — coluna `clerk_id`
- `src/lib/allowlist.ts` — `isEmailAllowed()` (função pura)
- `src/lib/allowlist.test.ts` — testes
- `src/lib/workspace.ts` — `requireWorkspaceId()`
- `src/app/sem-acesso/page.tsx` — bloqueio amigável
- `src/app/sign-in/[[...sign-in]]/page.tsx` — login próprio
- `src/app/sign-up/[[...sign-up]]/page.tsx` — cadastro próprio
- `src/middleware.ts` — proteção de rotas

**Modificar:** `prisma/schema.prisma`, `.env`, 9 actions, 15 pages, `src/components/Header.tsx` (detalhados nas tasks 5–7).

---

## Task 1: Migration — `clerkId` em User

**Files:**
- Modify: `prisma/schema.prisma` (model User)
- Create: `prisma/migrations/<ts>_user_clerk_id/migration.sql`

- [ ] **Step 1: Adicionar campo no schema**

Em `prisma/schema.prisma`, no `model User`, logo após a linha `id`:

```prisma
model User {
  id          String   @id @default(uuid())
  clerkId     String   @unique @map("clerk_id")
  email       String   @db.VarChar(255)
  name        String   @db.VarChar(100)
  role        Role     @default(owner)
  workspaceId String   @map("workspace_id")
  createdAt   DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id])

  @@map("users")
}
```

- [ ] **Step 2: Gerar timestamp da migration**

Run: `date +%Y%m%d%H%M%S`
Use o valor como `<ts>` no nome da pasta.

- [ ] **Step 3: Criar o arquivo de migration**

Create `prisma/migrations/<ts>_user_clerk_id/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "users" ADD COLUMN "clerk_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");
```

> Seguro: a tabela `users` está vazia (0 registros), então `NOT NULL` não viola nada.

- [ ] **Step 4: Aplicar e gerar o client**

Run: `npx prisma migrate deploy`
Expected: "All migrations have been successfully applied."
Run: `npx prisma generate`
Expected: "Generated Prisma Client".

- [ ] **Step 5: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add clerkId to User for tenant resolution"
```

---

## Task 2: `isEmailAllowed` (função pura + testes)

**Files:**
- Create: `src/lib/allowlist.ts`
- Test: `src/lib/allowlist.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/allowlist.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isEmailAllowed } from "./allowlist";

describe("isEmailAllowed", () => {
  const env = "alexandre.marcos60@gmail.com,daygruberdoces@gmail.com";

  it("aceita e-mail da lista", () => {
    expect(isEmailAllowed("daygruberdoces@gmail.com", env)).toBe(true);
  });

  it("é case-insensitive e ignora espaços", () => {
    expect(isEmailAllowed("  DAYGRUBERDOCES@GMAIL.COM ", env)).toBe(true);
  });

  it("rejeita e-mail fora da lista", () => {
    expect(isEmailAllowed("intruso@gmail.com", env)).toBe(false);
  });

  it("fail-safe: env vazio bloqueia todos", () => {
    expect(isEmailAllowed("daygruberdoces@gmail.com", "")).toBe(false);
    expect(isEmailAllowed("daygruberdoces@gmail.com", undefined)).toBe(false);
  });

  it("rejeita e-mail vazio/nulo", () => {
    expect(isEmailAllowed("", env)).toBe(false);
    expect(isEmailAllowed(undefined, env)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/lib/allowlist.test.ts`
Expected: FAIL ("Cannot find module './allowlist'").

- [ ] **Step 3: Implementar**

Create `src/lib/allowlist.ts`:

```ts
/** Verifica se um e-mail está na allowlist (env, separada por vírgulas). */
export function isEmailAllowed(
  email: string | undefined | null,
  envValue: string | undefined | null
): boolean {
  if (!email || !envValue) return false;
  const target = email.trim().toLowerCase();
  if (!target) return false;
  const allowed = envValue
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(target);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/allowlist.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/allowlist.ts src/lib/allowlist.test.ts
git commit -m "feat(auth): add isEmailAllowed allowlist helper with tests"
```

---

## Task 3: `requireWorkspaceId()` + página `/sem-acesso`

**Files:**
- Create: `src/lib/workspace.ts`
- Create: `src/app/sem-acesso/page.tsx`

- [ ] **Step 1: Implementar o helper**

Create `src/lib/workspace.ts`:

```ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/allowlist";

/**
 * Resolve o workspace do usuário do request. Provisiona o User no 1º acesso
 * (just-in-time) se o e-mail estiver na allowlist; caso contrário, redireciona
 * para /sem-acesso. Use em TODA page/action que toca dados do tenant.
 */
export async function requireWorkspaceId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Já vinculado?
  const existing = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { workspaceId: true },
  });
  if (existing) return existing.workspaceId;

  // 1º acesso → provisionamento JIT.
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  if (!isEmailAllowed(email, process.env.ALLOWED_EMAILS)) {
    redirect("/sem-acesso");
  }

  // Workspace alvo (estágio 1: o mais antigo / único).
  const workspace = await prisma.workspace.findFirstOrThrow({
    orderBy: { createdAt: "asc" },
    select: { id: true, ownerId: true },
  });

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    email!;

  const created = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email: email!,
      name,
      workspaceId: workspace.id,
      role: "owner",
    },
    select: { workspaceId: true },
  });

  // Corrige ownerId fake do workspace no primeiro owner real.
  if (workspace.ownerId !== userId) {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { ownerId: userId },
    });
  }

  return created.workspaceId;
}
```

- [ ] **Step 2: Criar a página /sem-acesso**

Create `src/app/sem-acesso/page.tsx`:

```tsx
import { SignOutButton } from "@clerk/nextjs";

export default function SemAcessoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Acesso não autorizado</h1>
      <p className="text-muted-foreground">
        Sua conta não tem acesso a este espaço de trabalho. Fale com o administrador
        para ser liberado.
      </p>
      <SignOutButton>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Sair
        </button>
      </SignOutButton>
    </main>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/lib/workspace.ts src/app/sem-acesso
git commit -m "feat(auth): add requireWorkspaceId helper with JIT provisioning"
```

---

## Task 4: Páginas de login próprias

**Files:**
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`
- Modify: `.env`

- [ ] **Step 1: Página de sign-in**

Create `src/app/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#182131] px-6">
      <SignIn />
    </main>
  );
}
```

- [ ] **Step 2: Página de sign-up**

Create `src/app/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#182131] px-6">
      <SignUp />
    </main>
  );
}
```

- [ ] **Step 3: Configurar envs do Clerk**

Adicionar ao `.env` (NÃO commitar `.env`):

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
ALLOWED_EMAILS=alexandre.marcos60@gmail.com,daygruberdoces@gmail.com
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/sign-in src/app/sign-up
git commit -m "feat(auth): add branded sign-in and sign-up pages"
```

---

## Task 5: Middleware de proteção de rotas

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Criar o middleware**

Create `src/middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|webp|woff2?|ttf)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 2: Reiniciar o dev server e verificar redirecionamento**

Run: parar o dev server, `npx tsc --noEmit`, depois `npm run dev`.
Verificação manual: abrir `localhost:3000/ingredientes` numa aba anônima → deve redirecionar para `/sign-in`.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(auth): protect all routes with Clerk middleware"
```

---

## Task 6: Aplicar `requireWorkspaceId` nas actions (escrita)

> Padrão: importar `import { requireWorkspaceId } from "@/lib/workspace";`, obter `const workspaceId = await requireWorkspaceId();` após o check de auth, e usar em `data`/`where`. Para updates/deletes por ID, validar que o registro pertence ao workspace.

**Files:** as 9 actions abaixo.

- [ ] **Step 1: `src/app/unidades/nova/actions.ts`**

Trocar o bloco que usa `findFirstOrThrow`:

```ts
// REMOVER:
// const workspace = await prisma.workspace.findFirstOrThrow({ select: { id: true } });
// USAR:
const workspaceId = await requireWorkspaceId();
```
E substituir `workspace.id` por `workspaceId` no `dup`/`create`.

- [ ] **Step 2: `src/app/insumos/novo/actions.ts`**

```ts
// REMOVER a derivação via categoria:
// const category = await prisma.category.findUniqueOrThrow({ where: { id: categoryId }, select: { workspaceId: true } });
const workspaceId = await requireWorkspaceId();
// validar a categoria do tenant:
const category = await prisma.category.findFirst({ where: { id: categoryId, workspaceId }, select: { id: true } });
if (!category) throw new Error("Categoria inválida.");
// no create: workspaceId,
```

- [ ] **Step 3: `src/app/receitas/nova/actions.ts`**

```ts
const workspaceId = await requireWorkspaceId();
const category = await prisma.productCategory.findFirst({ where: { id: categoryId, workspaceId }, select: { id: true } });
if (!category) return { error: "Categoria inválida." };
// no create: workspaceId,
```

- [ ] **Step 4: `src/app/entradas/nova/actions.ts`**

```ts
const workspaceId = await requireWorkspaceId();
const ingredient = await prisma.ingredient.findFirst({
  where: { id: ingredientId, workspaceId },
  select: { workspaceId: true },
});
if (!ingredient) throw new Error("Insumo inválido.");
// registerIngredientEntry({ workspaceId, ... })
```

- [ ] **Step 5: `src/app/insumos/[id]/editar/actions.ts`**

No update e no delete, validar antes:

```ts
const workspaceId = await requireWorkspaceId();
const owned = await prisma.ingredient.findFirst({ where: { id, workspaceId }, select: { id: true } });
if (!owned) return { error: "Insumo não encontrado." }; // no delete: throw new Error(...)
```
Também validar `categoryId` e `baseUnitId` do tenant (findFirst com workspaceId) no update.

- [ ] **Step 6: `src/app/receitas/[id]/editar/actions.ts`**

```ts
const workspaceId = await requireWorkspaceId();
const owned = await prisma.recipe.findFirst({ where: { id, workspaceId }, select: { id: true } });
if (!owned) return { error: "Receita não encontrada." }; // delete: throw
```

- [ ] **Step 7: `src/app/insumos/[id]/compras/actions.ts`**

```ts
const workspaceId = await requireWorkspaceId();
const entry = await prisma.ingredientEntry.findFirst({ where: { id: entryId, workspaceId }, select: { id: true } });
if (!entry) throw new Error("Compra não encontrada.");
```
Aplicar tanto no delete quanto no update.

- [ ] **Step 8: `src/app/unidades/[id]/editar/actions.ts`**

```ts
const workspaceId = await requireWorkspaceId();
// substituir findUnique por:
const unit = await prisma.unit.findFirst({ where: { id, workspaceId } });
if (!unit) return { error: "Unidade não encontrada." };
```
No delete (`deleteUnitAction`), validar igual antes de `prisma.unit.delete`.

- [ ] **Step 9: `src/app/simulador/actions.ts`**

```ts
const workspaceId = await requireWorkspaceId();
// ingredient.findUniqueOrThrow → findFirstOrThrow com workspaceId:
const ingredient = await prisma.ingredient.findFirstOrThrow({ where: { id: ingredientId, workspaceId }, include: { baseUnit: true } });
// unit.findUniqueOrThrow → findFirstOrThrow com workspaceId (em scenario)
// recipe.findMany → adicionar workspaceId no where
```

- [ ] **Step 10: Typecheck + commit**

Run: `npx tsc --noEmit` → sem erros.

```bash
git add src/app/unidades src/app/insumos src/app/receitas src/app/entradas src/app/simulador
git commit -m "feat(tenant): scope all write actions by workspace"
```

---

## Task 7: Aplicar filtro nas pages (leitura) + anti-IDOR

> Padrão (lista): `const workspaceId = await requireWorkspaceId();` e adicionar `where: { workspaceId }` (ou combinar com filtros existentes). Padrão (por ID): após `findUnique`, checar `if (!x || x.workspaceId !== workspaceId) notFound();` — preferível trocar por `findFirst({ where: { id, workspaceId } })`.

**Files:** as 15 pages abaixo.

- [ ] **Step 1: Listas simples** (adicionar `where: { workspaceId }`)

- `src/app/ingredientes/page.tsx` — `ingredient.findMany`
- `src/app/receitas/page.tsx` — `recipe.findMany`
- `src/app/margem/page.tsx` — `recipe.findMany`
- `src/app/reposicao/page.tsx` — `ingredient.findMany`
- `src/app/unidades/page.tsx` — `unit.findMany`

Exemplo (`ingredientes/page.tsx`):
```ts
const workspaceId = await requireWorkspaceId();
const ingredients = await prisma.ingredient.findMany({
  where: { workspaceId },
  orderBy: { name: "asc" },
});
```

- [ ] **Step 2: Pages com múltiplas listas** (cada `findMany` recebe `where: { workspaceId }`)

- `src/app/simulador/page.tsx` — ingredient.findMany, unit.findMany
- `src/app/entradas/nova/page.tsx` — ingredient.findMany, unit.findMany
- `src/app/insumos/novo/page.tsx` — category.findMany, unit.findMany (manter `toBaseFactor: 1` combinado: `where: { workspaceId, toBaseFactor: 1 }`)
- `src/app/receitas/nova/page.tsx` — productCategory.findMany, ingredient.findMany

- [ ] **Step 3: Pages por ID** (trocar `findUnique` por `findFirst` com workspaceId + `notFound`)

- `src/app/insumos/[id]/editar/page.tsx` — ingredient (por id), category/unit findMany com workspaceId
- `src/app/insumos/[id]/compras/page.tsx` — ingredient (por id)
- `src/app/insumos/[id]/compras/[entryId]/editar/page.tsx` — ingredientEntry (por id), unit findMany
- `src/app/receitas/[id]/editar/page.tsx` — recipe (por id), productCategory/ingredient findMany
- `src/app/unidades/[id]/editar/page.tsx` — unit (por id), counts (já escopados pela FK do unit validado)

Exemplo (`insumos/[id]/editar/page.tsx`):
```ts
const workspaceId = await requireWorkspaceId();
const [ingredient, categories, units] = await Promise.all([
  prisma.ingredient.findFirst({ where: { id, workspaceId } }),
  prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  prisma.unit.findMany({ where: { workspaceId, toBaseFactor: 1 }, orderBy: { name: "asc" } }),
]);
if (!ingredient) notFound();
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app
git commit -m "feat(tenant): scope all read pages by workspace + IDOR checks"
```

---

## Task 8: Header (contador de reposição)

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Escopar a contagem**

Em `getRestockCount()`, dentro do try, usar o helper:

```ts
import { requireWorkspaceId } from "@/lib/workspace";

async function getRestockCount(): Promise<number> {
  try {
    const workspaceId = await requireWorkspaceId();
    const ings = await prisma.ingredient.findMany({
      where: { workspaceId, minStockQty: { gt: 0 } },
      select: { stockQty: true, minStockQty: true },
    });
    return ings.filter((i) => Number(i.stockQty) <= Number(i.minStockQty)).length;
  } catch {
    return 0;
  }
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` → sem erros.

```bash
git add src/components/Header.tsx
git commit -m "feat(tenant): scope header restock count by workspace"
```

---

## Task 9: Verificação final (tsc + testes + isolamento manual)

**Files:** nenhum (verificação).

- [ ] **Step 1: Typecheck completo**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 2: Suíte de testes**

Run: `npx vitest run`
Expected: todos verdes (25 anteriores + 5 da allowlist = 30).

- [ ] **Step 3: Teste manual de login**

- Aba anônima → `localhost:3000` redireciona para `/sign-in` (página própria, fundo `#182131`).
- Logar com `alexandre.marcos60@gmail.com` → entra; `User` é criado (verificar com `npx tsx scripts/dbCounts.ts` → Usuários: 1).
- Logar com e-mail fora da allowlist → cai em `/sem-acesso`.

- [ ] **Step 4: Teste manual de isolamento**

- Criar um 2º workspace + insumo via script temporário (ou Prisma Studio).
- Confirmar que o usuário da Day NÃO vê dados do 2º workspace em nenhuma tela.
- Tentar acessar `/insumos/<id-do-outro-workspace>/editar` → `notFound()`.

- [ ] **Step 5: Commit final (se houver ajustes)**

```bash
git add -A
git commit -m "test(tenant): verify multi-tenant isolation"
```

---

## Notas de execução

- **Ordem importa:** Task 1 (migration) antes de tudo; Tasks 3–5 (helper/login/middleware) antes de 6–8.
- **Risco principal:** esquecer um `where: { workspaceId }`. O checklist das Tasks 6–7 cobre item a item; o teste de isolamento (Task 9) é a rede de segurança.
- **Não usar o helper em scripts** (`scripts/*`): eles rodam sem sessão e já recebem `workspaceId` explícito.
- **`.env` não é commitado:** apenas documente as variáveis novas.
