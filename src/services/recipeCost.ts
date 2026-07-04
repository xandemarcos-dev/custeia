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
    if (!Number.isFinite(item.qtyInBase) || item.qtyInBase < 0)
      throw new Error("Quantidade do insumo inválida.");
    if (!Number.isFinite(item.avgCost) || item.avgCost < 0)
      throw new Error("Custo médio do insumo inválido.");
    total += item.qtyInBase * item.avgCost;
  }
  return total;
}
