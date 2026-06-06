"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRecipeAction(formData: FormData) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Você precisa estar logado.");

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const yieldQty = Number(formData.get("yieldQty"));
  const unitPrice = Number(formData.get("unitPrice"));
  const targetMarginPct = Number(formData.get("targetMarginPct") ?? 0);
  const packagingCost = Number(formData.get("packagingCost") ?? 0);
  const fixedCostPct = Number(formData.get("fixedCostPct") ?? 0);

  // As listas (mesmo name) chegam alinhadas por índice.
  const ingredientIds = formData.getAll("ingredientId").map(String);
  const qtys = formData.getAll("qtyInBase").map((v) => Number(v));

  if (!name) throw new Error("O nome do produto é obrigatório.");
  if (!categoryId) throw new Error("Selecione a categoria do produto.");
  if (!(yieldQty > 0)) throw new Error("O rendimento deve ser maior que zero.");
  if (!(unitPrice > 0)) throw new Error("O preço de venda deve ser maior que zero.");

  // Monta os pares válidos (insumo escolhido + quantidade > 0).
  const items = ingredientIds
    .map((id, i) => ({ ingredientId: id, qtyInBase: qtys[i] }))
    .filter((it) => it.ingredientId && it.qtyInBase > 0);
  if (items.length === 0) throw new Error("Adicione ao menos um insumo.");

  const category = await prisma.productCategory.findUniqueOrThrow({
    where: { id: categoryId },
    select: { workspaceId: true },
  });

  // Cria receita + grupo + ingredientes numa só operação (escrita aninhada).
  await prisma.recipe.create({
    data: {
      workspaceId: category.workspaceId,
      name,
      categoryId,
      yieldQty,
      unitPrice,
      targetMarginPct,
      packagingCost,
      fixedCostPct,
      groups: {
        create: {
          name: "Massa",
          orderIndex: 0,
          ingredients: {
            create: items.map((it, i) => ({
              ingredientId: it.ingredientId,
              qtyInBase: it.qtyInBase,
              orderIndex: i,
            })),
          },
        },
      },
    },
  });

  revalidatePath("/receitas");
  revalidatePath("/margem");
  redirect("/receitas");
}
