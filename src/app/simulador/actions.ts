"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { simulatePurchase } from "@/services/simulatePurchase";
import { sumIngredientCost } from "@/services/recipeCost";
import { computeMargin } from "@/services/margin";

export type SimResult = {
  ingredientName: string;
  baseUnit: string;
  currentAvg: number;
  newAvgCost: number;
  deltaAvgCost: number;
  worthStocking: boolean;
  recipes: {
    name: string;
    currentMargin: number;
    newMargin: number;
    belowTarget: boolean;
  }[];
};

export type SimState = { error?: string; result?: SimResult };

export async function simulateAction(_prev: SimState, formData: FormData): Promise<SimState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const ingredientId = String(formData.get("ingredientId") ?? "");
  const purchaseUnitId = String(formData.get("purchaseUnitId") ?? "");
  const purchaseQty = Number(formData.get("purchaseQty"));
  const unitPrice = Number(formData.get("unitPrice"));
  const freightTotal = Number(formData.get("freightTotal") ?? 0);

  if (!ingredientId || !purchaseUnitId) return { error: "Selecione o insumo e a unidade." };
  if (!(purchaseQty > 0)) return { error: "A quantidade deve ser maior que zero." };
  if (!(unitPrice >= 0)) return { error: "O preço não pode ser negativo." };

  const ingredient = await prisma.ingredient.findUniqueOrThrow({
    where: { id: ingredientId },
    include: { baseUnit: true },
  });
  const purchaseUnit = await prisma.unit.findUniqueOrThrow({ where: { id: purchaseUnitId } });

  const currentAvg = Number(ingredient.avgCost);
  const sim = simulatePurchase({
    stockQty: Number(ingredient.stockQty),
    avgCost: currentAvg,
    purchaseQty,
    toBaseFactor: Number(purchaseUnit.toBaseFactor),
    unitPrice,
    freightTotal,
  });

  // Produtos afetados: recalcula a margem trocando o custo DESTE insumo pelo simulado.
  const recipes = await prisma.recipe.findMany({
    where: { isActive: true, groups: { some: { ingredients: { some: { ingredientId } } } } },
    include: { groups: { include: { ingredients: { include: { ingredient: true } } } } },
  });

  const affected = recipes.map((r) => {
    const itemsAtual = r.groups.flatMap((g) =>
      g.ingredients.map((ri) => ({
        qtyInBase: Number(ri.qtyInBase),
        avgCost: Number(ri.ingredient.avgCost),
      }))
    );
    const itemsNovo = r.groups.flatMap((g) =>
      g.ingredients.map((ri) => ({
        qtyInBase: Number(ri.qtyInBase),
        avgCost: ri.ingredientId === ingredientId ? sim.newAvgCost : Number(ri.ingredient.avgCost),
      }))
    );
    const base = {
      yieldQty: Number(r.yieldQty),
      unitPrice: Number(r.unitPrice),
      packagingCost: Number(r.packagingCost),
      fixedCostPct: Number(r.fixedCostPct),
      targetMarginPct: Number(r.targetMarginPct),
    };
    const atual = computeMargin({ ...base, ingredientCostBatch: sumIngredientCost(itemsAtual) });
    const novo = computeMargin({ ...base, ingredientCostBatch: sumIngredientCost(itemsNovo) });
    return {
      name: r.name,
      currentMargin: atual.marginPct,
      newMargin: novo.marginPct,
      belowTarget: novo.belowTarget,
    };
  });

  return {
    result: {
      ingredientName: ingredient.name,
      baseUnit: ingredient.baseUnit.baseUnit,
      currentAvg,
      newAvgCost: sim.newAvgCost,
      deltaAvgCost: sim.deltaAvgCost,
      worthStocking: sim.worthStocking,
      recipes: affected,
    },
  };
}
