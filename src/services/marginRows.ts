import { sumIngredientCost } from "./recipeCost";
import { computeMargin } from "./margin";

type RecipeWithGroups = {
  id: string;
  name: string;
  unitPrice: unknown;
  packagingCost: unknown;
  fixedCostPct: unknown;
  targetMarginPct: unknown;
  yieldQty: unknown;
  monthlySalesQty: unknown;
  groups: Array<{
    ingredients: Array<{
      qtyInBase: unknown;
      ingredient: { avgCost: unknown };
    }>;
  }>;
};

export type MarginRow = {
  id: string;
  name: string;
  unitPrice: number;
  target: number;
  monthlyQty: number | null;
  monthlyGain: number | null;
  unitCost: number;
  marginPct: number;
  marginGap: number;
  suggestedPrice: number;
  belowTarget: boolean;
};

export type MarginSummary = {
  rows: MarginRow[];
  ganhoTotalMes: number;
  produtosComGanho: number;
};

export function buildMarginRows(recipes: RecipeWithGroups[]): MarginSummary {
  const rows: MarginRow[] = recipes
    .map((r) => {
      const items = r.groups.flatMap((g) =>
        g.ingredients.map((ri) => ({
          qtyInBase: Number(ri.qtyInBase),
          avgCost: Number(ri.ingredient.avgCost),
        }))
      );

      let m;
      try {
        m = computeMargin({
          ingredientCostBatch: sumIngredientCost(items),
          yieldQty: Number(r.yieldQty),
          unitPrice: Number(r.unitPrice),
          packagingCost: Number(r.packagingCost),
          fixedCostPct: Number(r.fixedCostPct),
          targetMarginPct: Number(r.targetMarginPct),
        });
      } catch {
        // Produto com dados incompletos — exclui do ranking silenciosamente.
        return null;
      }

      const monthlyQty = r.monthlySalesQty == null ? null : Number(r.monthlySalesQty);
      const monthlyGain =
        m.belowTarget && monthlyQty != null
          ? (m.suggestedPrice - Number(r.unitPrice)) * monthlyQty
          : null;

      return {
        id: r.id,
        name: r.name,
        unitPrice: Number(r.unitPrice),
        target: Number(r.targetMarginPct),
        monthlyQty,
        monthlyGain,
        ...m,
      };
    })
    .filter((r): r is MarginRow => r !== null)
    .sort((a, b) => a.marginGap - b.marginGap);

  const ganhoTotalMes = rows.reduce((acc, r) => acc + (r.monthlyGain ?? 0), 0);
  const produtosComGanho = rows.filter((r) => (r.monthlyGain ?? 0) > 0).length;

  return { rows, ganhoTotalMes, produtosComGanho };
}
