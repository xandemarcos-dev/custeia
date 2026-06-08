"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { auth } from "@clerk/nextjs/server";
import { computeEntryAmounts } from "@/services/entryMath";
import { recomputeIngredient } from "@/services/recomputeIngredient";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteEntryAction(formData: FormData): Promise<void> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Você precisa estar logado.");

  const entryId = String(formData.get("entryId") ?? "");
  const ingredientId = String(formData.get("ingredientId") ?? "");
  if (!entryId || !ingredientId) throw new Error("Dados inválidos.");

  const workspaceId = await requireWorkspaceId();
  const entry = await prisma.ingredientEntry.findFirst({ where: { id: entryId, workspaceId }, select: { id: true } });
  if (!entry) throw new Error("Compra não encontrada.");

  await prisma.ingredientEntry.delete({ where: { id: entryId } });
  await recomputeIngredient(ingredientId); // reprocessa o histórico restante

  revalidatePath(`/insumos/${ingredientId}/compras`);
  revalidatePath("/ingredientes");
  revalidatePath("/margem");
  redirect(`/insumos/${ingredientId}/compras`);
}

export type EditEntryState = { error?: string };

export async function updateEntryAction(
  _prev: EditEntryState,
  formData: FormData
): Promise<EditEntryState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const entryId = String(formData.get("entryId") ?? "");
  const ingredientId = String(formData.get("ingredientId") ?? "");
  const purchaseUnitId = String(formData.get("purchaseUnitId") ?? "");
  const purchaseQty = Number(formData.get("purchaseQty"));
  const unitPrice = Number(formData.get("unitPrice"));
  const freightTotal = Number(formData.get("freightTotal") ?? 0);
  const entryDateStr = String(formData.get("entryDate") ?? "");

  if (!entryId || !ingredientId || !purchaseUnitId) return { error: "Dados inválidos." };
  if (!(purchaseQty > 0)) return { error: "A quantidade deve ser maior que zero." };
  if (!(unitPrice >= 0)) return { error: "O preço não pode ser negativo." };
  if (!(freightTotal >= 0)) return { error: "O frete não pode ser negativo." };
  if (!entryDateStr) return { error: "Informe a data." };

  const workspaceId = await requireWorkspaceId();
  const entry = await prisma.ingredientEntry.findFirst({ where: { id: entryId, workspaceId }, select: { id: true } });
  if (!entry) return { error: "Compra não encontrada." };

  const unit = await prisma.unit.findUniqueOrThrow({ where: { id: purchaseUnitId } });
  const amounts = computeEntryAmounts({
    purchaseQty,
    toBaseFactor: Number(unit.toBaseFactor),
    unitPrice,
    freightTotal,
  });

  await prisma.ingredientEntry.update({
    where: { id: entryId },
    data: {
      purchaseUnitId,
      purchaseQty,
      unitPrice,
      freightTotal,
      qtyInBase: amounts.qtyInBase,
      totalCost: amounts.totalCost,
      entryDate: new Date(entryDateStr),
    },
  });

  await recomputeIngredient(ingredientId); // recalcula a cadeia inteira

  revalidatePath(`/insumos/${ingredientId}/compras`);
  revalidatePath("/ingredientes");
  revalidatePath("/margem");
  redirect(`/insumos/${ingredientId}/compras`);
}
