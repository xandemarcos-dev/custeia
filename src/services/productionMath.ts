export interface RecipeItemForProduction {
  ingredientId: string;
  qtyInBase: number;
}

/**
 * Soma a necessidade de cada insumo para N lotes — o mesmo ingrediente pode
 * aparecer em vários grupos da ficha técnica (ex: chocolate na massa e na
 * cobertura) e precisa ser consolidado.
 */
export function computeProductionNeeds(
  items: RecipeItemForProduction[],
  batchCount: number
): Map<string, number> {
  const need = new Map<string, number>();
  for (const it of items) {
    need.set(it.ingredientId, (need.get(it.ingredientId) ?? 0) + it.qtyInBase * batchCount);
  }
  return need;
}
