"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type NewIngredientState = { error?: string };

export async function createIngredientAction(
  _prev: NewIngredientState,
  formData: FormData
): Promise<NewIngredientState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const baseUnitId = String(formData.get("baseUnitId") ?? "");
  const minStockQty = Number(formData.get("minStockQty") ?? 0);

  if (!name) return { error: "O nome do insumo é obrigatório." };
  if (!categoryId || !baseUnitId) {
    return { error: "Selecione a categoria e a unidade base." };
  }

  try {
    const workspaceId = await requireWorkspaceId();
    const category = await prisma.category.findFirst({ where: { id: categoryId, workspaceId }, select: { id: true } });
    if (!category) return { error: "Categoria inválida." };
    const baseUnit = await prisma.unit.findFirst({ where: { id: baseUnitId, workspaceId }, select: { id: true } });
    if (!baseUnit) return { error: "Unidade base inválida." };

    await prisma.ingredient.create({
      data: {
        workspaceId,
        name,
        brand: brand || null,
        categoryId,
        baseUnitId,
        minStockQty: Number.isFinite(minStockQty) ? minStockQty : 0,
        // stockQty e avgCost NÃO são informados → nascem 0 (regra de ouro).
      },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao cadastrar insumo." };
  }

  revalidatePath("/ingredientes");
  redirect("/ingredientes");
}
