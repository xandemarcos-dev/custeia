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

  // Semeia categorias padrão se o workspace ainda não tem nenhuma.
  await seedDefaultCategories(workspace.id);

  return created.workspaceId;
}

const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
  { name: "Laticínios", color: "#fce4ec" },
  { name: "Chocolates e cacau", color: "#4e342e" },
  { name: "Farinhas e amidos", color: "#fff9c4" },
  { name: "Açúcares", color: "#f3e5f5" },
  { name: "Embalagens", color: "#e3f2fd" },
  { name: "Outros", color: "#eceff1" },
];

async function seedDefaultCategories(workspaceId: string): Promise<void> {
  const existing = await prisma.category.count({ where: { workspaceId } });
  if (existing > 0) return;

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ workspaceId, name: c.name, color: c.color })),
    skipDuplicates: true,
  });
}
