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
  const productTotal = Number(formData.get("productTotal"));
  const freightTotal = Number(formData.get("freightTotal") ?? 0);
  const supplierName = String(formData.get("supplierName") ?? "").trim();

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

  // Resolve fornecedor: reutiliza se já existe, cria se for nome novo.
  let supplierId: string | null = null;
  if (supplierName) {
    const existing = await prisma.supplier.findFirst({
      where: { workspaceId, name: { equals: supplierName, mode: "insensitive" } },
    });
    if (existing) {
      supplierId = existing.id;
    } else {
      const created = await prisma.supplier.create({
        data: { workspaceId, name: supplierName },
      });
      supplierId = created.id;
    }
  }

  await registerIngredientEntry({
    workspaceId,
    ingredientId,
    supplierId,
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
