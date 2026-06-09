"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { registerIngredientEntry } from "@/services/registerIngredientEntry";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEntryAction(formData: FormData) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Você precisa estar logado.");

  // Lê os campos enviados pelo formulário.
  const ingredientId = String(formData.get("ingredientId") ?? "");
  const purchaseUnitId = String(formData.get("purchaseUnitId") ?? "");
  const purchaseQty = Number(formData.get("purchaseQty"));
  // Agora o usuário informa o TOTAL pago pelos itens (sem frete);
  // o preço unitário é derivado para a trilha de auditoria.
  const productTotal = Number(formData.get("productTotal"));
  const freightTotal = Number(formData.get("freightTotal") ?? 0);

  // Validação mínima (a ponte também valida, mas erramos cedo aqui).
  if (!ingredientId || !purchaseUnitId) {
    throw new Error("Selecione o insumo e a unidade de compra.");
  }
  if (!(purchaseQty > 0)) throw new Error("A quantidade deve ser maior que zero.");
  if (!(productTotal >= 0)) throw new Error("O preço total não pode ser negativo.");

  const unitPrice = productTotal / purchaseQty;

  const workspaceId = await requireWorkspaceId();
  const ingredient = await prisma.ingredient.findFirst({ where: { id: ingredientId, workspaceId }, select: { workspaceId: true } });
  if (!ingredient) throw new Error("Insumo inválido.");

  // Chama a PONTE — a mesma regra de negócio do Passo 4 e do seed.
  await registerIngredientEntry({
    workspaceId,
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
