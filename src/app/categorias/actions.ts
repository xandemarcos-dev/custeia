"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CategoryActionState = { error?: string; success?: boolean };

export async function createCategoryAction(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "O nome da categoria é obrigatório." };

  const workspaceId = await requireWorkspaceId();

  const dup = await prisma.category.findFirst({
    where: { workspaceId, name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (dup) return { error: `Já existe uma categoria chamada "${name}".` };

  await prisma.category.create({
    data: {
      workspaceId,
      name,
      color: "#eceff1",
    },
  });

  revalidatePath("/categorias");
  return { success: true };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Você precisa estar logado.");

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Categoria inválida.");

  const workspaceId = await requireWorkspaceId();
  const category = await prisma.category.findFirst({
    where: { id, workspaceId },
    select: { id: true },
  });
  if (!category) redirect("/categorias?erro=nao-encontrada");

  const inUse = await prisma.ingredient.count({ where: { categoryId: id } });
  if (inUse > 0) {
    redirect(`/categorias?erro=em-uso`);
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categorias");
  redirect("/categorias");
}
