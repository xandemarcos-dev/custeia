"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EditState = { error?: string };

export async function updateIngredientAction(
  _prev: EditState,
  formData: FormData
): Promise<EditState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const baseUnitId = String(formData.get("baseUnitId") ?? "");
  const minStockQty = Number(formData.get("minStockQty") ?? 0);

  if (!id) return { error: "Insumo inválido." };
  if (!name) return { error: "Informe o nome do insumo." };
  if (!categoryId || !baseUnitId) return { error: "Selecione categoria e unidade base." };

  const workspaceId = await requireWorkspaceId();
  const owned = await prisma.ingredient.findFirst({ where: { id, workspaceId }, select: { id: true } });
  if (!owned) return { error: "Insumo não encontrado." };

  const ownedCategory = await prisma.category.findFirst({ where: { id: categoryId, workspaceId }, select: { id: true } });
  if (!ownedCategory) return { error: "Categoria inválida." };

  const ownedUnit = await prisma.unit.findFirst({ where: { id: baseUnitId, workspaceId }, select: { id: true } });
  if (!ownedUnit) return { error: "Unidade base inválida." };

  // Note: stockQty e avgCost NÃO são editáveis aqui (regra de ouro).
  await prisma.ingredient.update({
    where: { id },
    data: {
      name,
      brand: brand || null,
      categoryId,
      baseUnitId,
      minStockQty: Number.isFinite(minStockQty) ? minStockQty : 0,
    },
  });

  revalidatePath("/ingredientes");
  redirect("/ingredientes");
}

export async function deleteIngredientAction(formData: FormData): Promise<void> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Você precisa estar logado.");

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Insumo inválido.");

  const workspaceId = await requireWorkspaceId();
  const owned = await prisma.ingredient.findFirst({ where: { id, workspaceId }, select: { id: true } });
  if (!owned) throw new Error("Insumo não encontrado.");

  // Trava de integridade: só exclui se não houver histórico/uso.
  const [entries, exits, usedInRecipes] = await Promise.all([
    prisma.ingredientEntry.count({ where: { ingredientId: id } }),
    prisma.ingredientExit.count({ where: { ingredientId: id } }),
    prisma.recipeIngredient.count({ where: { ingredientId: id } }),
  ]);

  if (entries + exits + usedInRecipes > 0) {
    redirect(`/insumos/${id}/editar?erro=em-uso`);
  }

  await prisma.ingredient.delete({ where: { id } });
  revalidatePath("/ingredientes");
  redirect("/ingredientes");
}
