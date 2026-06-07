"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { simulatePurchase } from "@/services/simulatePurchase";
import { sumIngredientCost } from "@/services/recipeCost";
import { computeMargin } from "@/services/margin";

export type ScenarioResult = {
  entryUnitCost: number;
  newAvgCost: number;
  deltaAvgCost: number;
  worthStocking: boolean;
};

export type SimResult = {
  ingredientName: string;
  baseUnit: string;
  currentAvg: number;
  a: ScenarioResult;
  b: ScenarioResult | null;
  winner: "a" | "b" | "empate" | null;
  recipes: {
    name: string;
    currentMargin: number;
    newMargin: number;
    belowTarget: boolean;
  }[];
};

export type SimState = { error?: string; result?: SimResult };

async function scenario(
  ingredient: { stockQty: unknown; avgCost: number },
  purchaseUnitId: string,
  purchaseQty: number,
  unitPrice: number,
  freightTotal: number
): Promise<ScenarioResult> {
  const unit = await prisma.unit.findUniqueOrThrow({ where: { id: purchaseUnitId } });
  const sim = simulatePurchase({
    stockQty: Number(ingredient.stockQty),
    avgCost: ingredient.avgCost,
    purchaseQty,
    toBaseFactor: Number(unit.toBaseFactor),
    unitPrice,
    freightTotal,
  });
  return {
    entryUnitCost: sim.entryUnitCost,
    newAvgCost: sim.newAvgCost,
    deltaAvgCost: sim.deltaAvgCost,
    worthStocking: sim.worthStocking,
  };
}

export async function simulateAction(_prev: SimState, formData: FormData): Promise<SimState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const ingredientId = String(formData.get("ingredientId") ?? "");
  // Fornecedor A (obrigatório)
  const unitA = String(formData.get("purchaseUnitIdA") ?? "");
  const qtyA = Number(formData.get("purchaseQtyA"));
  const priceA = Number(formData.get("unitPriceA"));
  const freightA = Number(formData.get("freightTotalA") ?? 0);
  // Fornecedor B (opcional)
  const unitB = String(formData.get("purchaseUnitIdB") ?? "");
  const qtyB = Number(formData.get("purchaseQtyB"));
  const priceB = Number(formData.get("unitPriceB"));
  const freightB = Number(formData.get("freightTotalB") ?? 0);

  if (!ingredientId) return { error: "Selecione o insumo." };
  if (!unitA) return { error: "Selecione a unidade do Fornecedor A." };
  if (!(qtyA > 0)) return { error: "A quantidade do Fornecedor A deve ser maior que zero." };
  if (!(priceA >= 0)) return { error: "O preço do Fornecedor A não pode ser negativo." };

  const hasB = Boolean(unitB) && qtyB > 0 && priceB >= 0;

  const ingredient = await prisma.ingredient.findUniqueOrThrow({
    where: { id: ingredientId },
    include: { baseUnit: true },
  });
  const currentAvg = Number(ingredient.avgCost);
  const ingForSim = { stockQty: ingredient.stockQty, avgCost: currentAvg };

  const a = await scenario(ingForSim, unitA, qtyA, priceA, freightA);
  const b = hasB ? await scenario(ingForSim, unitB, qtyB, priceB, freightB) : null;

  let winner: SimResult["winner"] = null;
  let chosenNewAvg = a.newAvgCost;
  if (b) {
    if (a.newAvgCost < b.newAvgCost) {
      winner = "a";
      chosenNewAvg = a.newAvgCost;
    } else if (b.newAvgCost < a.newAvgCost) {
      winner = "b";
      chosenNewAvg = b.newAvgCost;
    } else {
      winner = "empate";
    }
  }

  // Impacto na margem dos produtos, usando o custo do cenário vencedor (ou A).
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
        avgCost: ri.ingredientId === ingredientId ? chosenNewAvg : Number(ri.ingredient.avgCost),
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
      a,
      b,
      winner,
      recipes: affected,
    },
  };
}
