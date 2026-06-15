"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { parseRecipeGroupsFromForm } from "@/lib/recipeGroups";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EditRecipeState = { error?: string };

export async function updateRecipeAction(
  _prev: EditRecipeState,
  formData: FormData
): Promise<EditRecipeState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const yieldQty = Number(formData.get("yieldQty"));
  const unitPrice = Number(formData.get("unitPrice"));
  const targetMarginPct = Number(formData.get("targetMarginPct"));
  const packagingCost = Number(formData.get("packagingCost"));
  const fixedCostPct = Number(formData.get("fixedCostPct"));
  const monthlySalesRaw = String(formData.get("monthlySalesQty") ?? "").trim();
  // 0 e vazio são tratados como "não informado" (null): sem volume não há ganho
  // a calcular, e a coluna Vol./mês volta a mostrar "definir".
  const monthlySalesQty =
    monthlySalesRaw === "" || Number(monthlySalesRaw) === 0 ? null : Number(monthlySalesRaw);
  const groups = parseRecipeGroupsFromForm(formData);

  if (!id) return { error: "Produto inválido." };
  if (!name) return { error: "Informe o nome do produto." };
  if (!categoryId) return { error: "Selecione a categoria." };

  const workspaceId = await requireWorkspaceId();
  const owned = await prisma.recipe.findFirst({ where: { id, workspaceId }, select: { id: true } });
  if (!owned) return { error: "Receita não encontrada." };
  if (!(yieldQty > 0)) return { error: "O rendimento deve ser maior que zero." };
  if (!(unitPrice > 0)) return { error: "O preço de venda deve ser maior que zero." };
  if (!(targetMarginPct >= 0 && targetMarginPct < 100)) return { error: "A margem alvo deve estar entre 0 e 99%." };
  if (!(packagingCost >= 0)) return { error: "A embalagem não pode ser negativa." };
  if (!(fixedCostPct >= 0)) return { error: "Os custos fixos não podem ser negativos." };
  if (monthlySalesQty !== null && !(monthlySalesQty >= 0)) {
    return { error: "A venda/mês não pode ser negativa." };
  }

  const ownedCat = await prisma.productCategory.findFirst({ where: { id: categoryId, workspaceId }, select: { id: true } });
  if (!ownedCat) return { error: "Categoria inválida." };

  const allItems = groups.flatMap((g) => g.items);
  if (allItems.length === 0) return { error: "Adicione ao menos um insumo." };

  // Garante que todos os insumos pertencem ao workspace (evita referência cruzada).
  const uniqueIngredientIds = [...new Set(allItems.map((it) => it.ingredientId))];
  const ownedIngredients = await prisma.ingredient.count({
    where: { workspaceId, id: { in: uniqueIngredientIds } },
  });
  if (ownedIngredients !== uniqueIngredientIds.length) {
    return { error: "Um ou mais insumos são inválidos." };
  }

  // Atualiza campos e RECONSTRÓI a lista de ingredientes (apaga e recria), em transação.
  await prisma.$transaction(async (tx) => {
    await tx.recipe.update({
      where: { id },
      data: { name, categoryId, yieldQty, unitPrice, targetMarginPct, packagingCost, fixedCostPct, monthlySalesQty },
    });
    await tx.recipeIngredient.deleteMany({ where: { group: { recipeId: id } } });
    await tx.recipeIngredientGroup.deleteMany({ where: { recipeId: id } });
    for (let gi = 0; gi < groups.length; gi++) {
      await tx.recipeIngredientGroup.create({
        data: {
          recipeId: id,
          name: groups[gi].name,
          orderIndex: gi,
          ingredients: {
            create: groups[gi].items.map((it, i) => ({ ingredientId: it.ingredientId, qtyInBase: it.qtyInBase, orderIndex: i })),
          },
        },
      });
    }
  });

  revalidatePath("/receitas");
  revalidatePath("/margem");
  redirect("/receitas");
}

export async function deleteRecipeAction(formData: FormData): Promise<void> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Você precisa estar logado.");

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Produto inválido.");

  const workspaceId = await requireWorkspaceId();
  const owned = await prisma.recipe.findFirst({ where: { id, workspaceId }, select: { id: true } });
  if (!owned) throw new Error("Receita não encontrada.");

  // Apaga de baixo para cima: ingredientes-da-receita → grupos → receita.
  await prisma.$transaction([
    prisma.recipeIngredient.deleteMany({ where: { group: { recipeId: id } } }),
    prisma.recipeIngredientGroup.deleteMany({ where: { recipeId: id } }),
    prisma.recipe.delete({ where: { id } }),
  ]);

  revalidatePath("/receitas");
  revalidatePath("/margem");
  redirect("/receitas");
}
