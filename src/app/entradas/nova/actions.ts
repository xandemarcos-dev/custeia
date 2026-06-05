"use server";

import { prisma } from "@/lib/prisma";
import { registerIngredientEntry } from "@/services/registerIngredientEntry";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEntryAction(formData: FormData) {
  // Lê os campos enviados pelo formulário.
  const ingredientId = String(formData.get("ingredientId") ?? "");
  const purchaseUnitId = String(formData.get("purchaseUnitId") ?? "");
  const purchaseQty = Number(formData.get("purchaseQty"));
  const unitPrice = Number(formData.get("unitPrice"));
  const freightTotal = Number(formData.get("freightTotal") ?? 0);

  // Validação mínima (a ponte também valida, mas erramos cedo aqui).
  if (!ingredientId || !purchaseUnitId) {
    throw new Error("Selecione o insumo e a unidade de compra.");
  }

  // Descobre o workspace a partir do insumo escolhido.
  const ingredient = await prisma.ingredient.findUniqueOrThrow({
    where: { id: ingredientId },
    select: { workspaceId: true },
  });

  // Chama a PONTE — a mesma regra de negócio do Passo 4 e do seed.
  await registerIngredientEntry({
    workspaceId: ingredient.workspaceId,
    ingredientId,
    entryDate: new Date(),
    purchaseUnitId,
    purchaseQty,
    unitPrice,
    freightTotal,
  });

  // Marca a lista como "precisa atualizar" e leva o usuário até ela.
  revalidatePath("/ingredientes");
  redirect("/ingredientes");
}
