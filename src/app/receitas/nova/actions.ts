"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { parseRecipeGroupsFromForm } from "@/lib/recipeGroups";
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
  // 0 e vazio são tratados como "não informado" (null): sem volume não há ganho
  // a calcular, e a coluna Vol./mês volta a mostrar "definir".
  const monthlySalesQty =
    monthlySalesRaw === "" || Number(monthlySalesRaw) === 0 ? null : Number(monthlySalesRaw);

  // Grupos da ficha técnica (ex.: Massa, Cobertura), reconstruídos do FormData.
  const groups = parseRecipeGroupsFromForm(formData);

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

  const allItems = groups.flatMap((g) => g.items);
  if (allItems.length === 0) {
    return { error: "Adicione ao menos um insumo com quantidade maior que zero." };
  }

  const workspaceId = await requireWorkspaceId();
  const category = await prisma.productCategory.findFirst({ where: { id: categoryId, workspaceId }, select: { id: true } });
  if (!category) return { error: "Categoria inválida." };

  // Garante que todos os insumos pertencem ao workspace (evita referência cruzada).
  const uniqueIngredientIds = [...new Set(allItems.map((it) => it.ingredientId))];
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
        create: groups.map((g, gi) => ({
          name: g.name,
          orderIndex: gi,
          ingredients: {
            create: g.items.map((it, i) => ({
              ingredientId: it.ingredientId,
              qtyInBase: it.qtyInBase,
              orderIndex: i,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/receitas");
  revalidatePath("/margem");
  redirect("/receitas");
}
