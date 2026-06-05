/**
 * Entrada para o recálculo de custo médio ponderado móvel.
 * Todas as quantidades estão na UNIDADE BASE do ingrediente (ex: gramas).
 * Todos os custos estão em R$ por unidade base.
 */
export interface RecalcAvgCostInput {
  /** Estoque atual, em unidade base (ex: 1580 g). */
  stockQty: number;
  /** Custo médio atual, em R$/unidade base (ex: 0,029215). */
  avgCost: number;
  /** Quantidade que está entrando, em unidade base. */
  entryQtyInBase: number;
  /** Custo dessa entrada, em R$/unidade base. */
  entryUnitCost: number;
}

export interface RecalcAvgCostResult {
  /** Novo estoque após a entrada. */
  newStockQty: number;
  /** Novo custo médio ponderado móvel. */
  newAvgCost: number;
}

/**
 * Recalcula o custo médio ponderado móvel após uma entrada de estoque.
 *
 * Fórmula:
 *   avg_novo = (stockQty × avgCost + entryQtyInBase × entryUnitCost)
 *              ───────────────────────────────────────────────────
 *                         (stockQty + entryQtyInBase)
 */
export function recalcAvgCost(input: RecalcAvgCostInput): RecalcAvgCostResult {
  const { stockQty, avgCost, entryQtyInBase, entryUnitCost } = input;

  if (entryQtyInBase <= 0) {
    throw new Error("A quantidade de entrada deve ser maior que zero.");
  }
  if (entryUnitCost < 0) {
    throw new Error("O custo de entrada não pode ser negativo.");
  }
  if (stockQty < 0 || avgCost < 0) {
    throw new Error("Estoque e custo médio atuais não podem ser negativos.");
  }

  const newStockQty = stockQty + entryQtyInBase;

  const valorEstoqueAtual = stockQty * avgCost;
  const valorEntrada = entryQtyInBase * entryUnitCost;
  const newAvgCost = (valorEstoqueAtual + valorEntrada) / newStockQty;

  return { newStockQty, newAvgCost };
}
