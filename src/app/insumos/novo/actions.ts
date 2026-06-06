"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createIngredientAction(formData: FormData) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Você precisa estar logado.");

  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const baseUnitId = String(formData.get("baseUnitId") ?? "");
  const minStockQty = Number(formData.get("minStockQty") ?? 0);

  if (!name) throw new Error("O nome do insumo é obrigatório.");
  if (!categoryId || !baseUnitId) {
    throw new Error("Selecione a categoria e a unidade base.");
  }

  // Descobre o workspace a partir da categoria escolhida (multi-tenant).
  const category = await prisma.category.findUniqueOrThrow({
    where: { id: categoryId },
    select: { workspaceId: true },
  });

  await prisma.ingredient.create({
    data: {
      workspaceId: category.workspaceId,
      name,
      brand: brand || null,
      categoryId,
      baseUnitId,
      minStockQty: Number.isFinite(minStockQty) ? minStockQty : 0,
      // stockQty e avgCost NÃO são informados → nascem 0 (regra de ouro).
    },
  });

  revalidatePath("/ingredientes");
  redirect("/ingredientes");
}
