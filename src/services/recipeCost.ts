export interface RecipeIngredientCost {
  /** Quantidade do insumo na receita, em unidade base. */
  qtyInBase: number;
  /** Custo médio atual do insumo, em R$/unidade base. */
  avgCost: number;
}

/**
 * Soma o custo de insumos de uma receita (por lote):
 *   Σ (qtyInBase × avgCost)
 */
export function sumIngredientCost(items: RecipeIngredientCost[]): number {
  let total = 0;
  for (const item of items) {
    if (item.qtyInBase < 0 || item.avgCost < 0) {
      throw new Error("Quantidade e custo não podem ser negativos.");
    }
    total += item.qtyInBase * item.avgCost;
  }
  return total;
}
