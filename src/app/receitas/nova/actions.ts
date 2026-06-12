"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type RecipeFormState = { error?: string };

export async function createRecipeAction(
  _prev: RecipeFormState,
  formData: FormData
): Promise<RecipeFormState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const yieldQty = Number(formData.get("yieldQty"));
  const unitPrice = Number(formData.get("unitPrice"));
  const targetMarginPct = Number(formData.get("targetMarginPct"));
  const packagingCost = Number(formData.get("packagingCost"));
  const fixedCostPct = Number(formData.get("fixedCostPct"));
  const monthlySalesRaw = String(formData.get("monthlySalesQty") ?? "").trim();
  const monthlySalesQty = monthlySalesRaw === "" ? null : Number(monthlySalesRaw);

  // As listas (mesmo name) chegam alinhadas por índice.
  const ingredientIds = formData.getAll("ingredientId").map(String);
  const qtys = formData.getAll("qtyInBase").map((v) => Number(v));

  // Validação — devolve mensagem amigável em vez de quebrar a tela.
  if (!name) return { error: "Informe o nome do produto." };
  if (!categoryId) return { error: "Selecione a categoria do produto." };
  if (!(yieldQty > 0)) return { error: "O rendimento (porções) deve ser maior que zero." };
  if (!(unitPrice > 0)) return { error: "O preço de venda deve ser maior que zero." };
  if (!(targetMarginPct >= 0 && targetMarginPct < 100)) {
    return { error: "A margem alvo deve estar entre 0 e 99%." };
  }
  if (!(packagingCost >= 0)) return { error: "A embalagem não pode ser negativa." };
  if (!(fixedCostPct >= 0)) return { error: "Os custos fixos não podem ser negativos." };
  if (monthlySalesQty !== null && !(monthlySalesQty >= 0)) {
    return { error: "A venda/mês não pode ser negativa." };
  }

  const items = ingredientIds
    .map((id, i) => ({ ingredientId: id, qtyInBase: qtys[i] }))
    .filter((it) => it.ingredientId && it.qtyInBase > 0);
  if (items.length === 0) {
    return { error: "Adicione ao menos um insumo com quantidade maior que zero." };
  }

  const workspaceId = await requireWorkspaceId();
  const category = await prisma.productCategory.findFirst({ where: { id: categoryId, workspaceId }, select: { id: true } });
  if (!category) return { error: "Categoria inválida." };

  // Garante que todos os insumos pertencem ao workspace (evita referência cruzada).
  const uniqueIngredientIds = [...new Set(items.map((it) => it.ingredientId))];
  const ownedIngredients = await prisma.ingredient.count({
    where: { workspaceId, id: { in: uniqueIngredientIds } },
  });
  if (ownedIngredients !== uniqueIngredientIds.length) {
    return { error: "Um ou mais insumos são inválidos." };
  }

  // Cria receita + grupo + ingredientes numa só operação (escrita aninhada).
  await prisma.recipe.create({
    data: {
      workspaceId,
      name,
      categoryId,
      yieldQty,
      unitPrice,
      targetMarginPct,
      packagingCost,
      fixedCostPct,
      monthlySalesQty,
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
