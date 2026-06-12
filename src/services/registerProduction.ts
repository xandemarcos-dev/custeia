import { prisma } from "@/lib/prisma";
import { computeProductionNeeds } from "./productionMath";

export interface RegisterProductionInput {
  workspaceId: string;
  recipeId: string;
  batchCount: number;
  productionDate: Date;
  notes?: string | null;
}

/**
 * Registra a produção de N lotes de uma receita. Numa transação:
 * - debita do estoque cada ingrediente da ficha técnica (batchCount × qtyInBase),
 * - cria um IngredientExit por insumo (source='production') com snapshot do custo,
 * - bloqueia se algum insumo ficaria com estoque negativo (força a correção).
 *
 * Não mexe em avgCost: o custo médio só muda em entrada (regra de ouro).
 */
export async function registerProduction(input: RegisterProductionInput) {
  if (!(input.batchCount > 0)) {
    throw new Error("A quantidade de lotes deve ser maior que zero.");
  }

  return prisma.$transaction(async (tx) => {
    const recipe = await tx.recipe.findFirst({
      where: { id: input.recipeId, workspaceId: input.workspaceId, isActive: true },
      include: { groups: { include: { ingredients: true } } },
    });
    if (!recipe) throw new Error("Receita inválida.");

    const flatItems = recipe.groups.flatMap((g) =>
      g.ingredients.map((ri) => ({ ingredientId: ri.ingredientId, qtyInBase: Number(ri.qtyInBase) }))
    );
    const needByIngredient = computeProductionNeeds(flatItems, input.batchCount);
    if (needByIngredient.size === 0) {
      throw new Error("Esta receita não tem ingredientes cadastrados.");
    }

    const ingredients = await tx.ingredient.findMany({
      where: { id: { in: [...needByIngredient.keys()] }, workspaceId: input.workspaceId },
    });
    if (ingredients.length !== needByIngredient.size) {
      throw new Error("Algum ingrediente da receita não pertence a este workspace.");
    }

    // Pré-validação: estoque suficiente em todos os insumos.
    const shortages: string[] = [];
    for (const ing of ingredients) {
      const need = needByIngredient.get(ing.id)!;
      if (Number(ing.stockQty) < need) {
        shortages.push(`${ing.name} (tem ${Number(ing.stockQty)}, precisa ${need})`);
      }
    }
    if (shortages.length > 0) {
      throw new Error(
        `Estoque insuficiente para: ${shortages.join("; ")}. Registre as compras antes.`
      );
    }

    const exits = [];
    for (const ing of ingredients) {
      const qty = needByIngredient.get(ing.id)!;
      const exit = await tx.ingredientExit.create({
        data: {
          workspaceId: input.workspaceId,
          ingredientId: ing.id,
          exitDate: input.productionDate,
          qtyInBase: qty,
          unitCost: ing.avgCost,
          source: "production",
          notes: input.notes ?? null,
        },
      });
      await tx.ingredient.update({
        where: { id: ing.id },
        data: { stockQty: { decrement: qty } },
      });
      exits.push(exit);
    }

    return { recipe, exits, batchCount: input.batchCount };
  });
}
