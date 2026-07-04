"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { registerIngredientEntry } from "@/services/registerIngredientEntry";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type NewEntryState = { error?: string };

export async function createEntryAction(
  _prev: NewEntryState,
  formData: FormData
): Promise<NewEntryState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  // Lê os campos enviados pelo formulário.
  const ingredientId = String(formData.get("ingredientId") ?? "");
  const purchaseUnitId = String(formData.get("purchaseUnitId") ?? "");
  const purchaseQty = Number(formData.get("purchaseQty"));
  const productTotal = Number(formData.get("productTotal"));
  const freightTotal = Number(formData.get("freightTotal") ?? 0);
  const supplierName = String(formData.get("supplierName") ?? "").trim();
  const entryDateStr = String(formData.get("entryDate") ?? "").trim();

  // Validação mínima (a ponte também valida, mas erramos cedo aqui).
  if (!ingredientId || !purchaseUnitId) {
    return { error: "Selecione o insumo e a unidade de compra." };
  }
  if (!(purchaseQty > 0)) return { error: "A quantidade deve ser maior que zero." };
  if (!(productTotal >= 0)) return { error: "O preço total não pode ser negativo." };
  if (!entryDateStr) return { error: "Informe a data da compra." };
  const entryDate = new Date(`${entryDateStr}T12:00:00Z`);
  if (isNaN(entryDate.getTime())) return { error: "Data da compra inválida." };

  const unitPrice = productTotal / purchaseQty;

  try {
    const workspaceId = await requireWorkspaceId();
    const [ingredient, unit] = await Promise.all([
      prisma.ingredient.findFirst({ where: { id: ingredientId, workspaceId }, select: { workspaceId: true } }),
      prisma.unit.findFirst({ where: { id: purchaseUnitId, workspaceId }, select: { id: true } }),
    ]);
    if (!ingredient) return { error: "Insumo inválido." };
    if (!unit) return { error: "Unidade de compra inválida." };

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
      entryDate,
      purchaseUnitId,
      purchaseQty,
      unitPrice,
      freightTotal,
    });
  } catch (e) {
    if (e instanceof Error && (e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { error: e instanceof Error ? e.message : "Falha ao registrar compra." };
  }

  // Marca a lista como "precisa atualizar" e leva o usuário até ela.
  revalidatePath("/ingredientes");
  redirect("/ingredientes?ok=compra");
}
