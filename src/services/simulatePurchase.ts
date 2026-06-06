import { computeEntryAmounts } from "./entryMath";
import { recalcAvgCost } from "./avgCost";

export interface SimulatePurchaseInput {
  /** Estoque atual em unidade base. */
  stockQty: number;
  /** Custo médio atual em R$/unidade base. */
  avgCost: number;
  /** Quantidade da compra hipotética, na unidade de compra. */
  purchaseQty: number;
  /** Fator da unidade de compra para a base. */
  toBaseFactor: number;
  /** Preço hipotético por unidade de compra. */
  unitPrice: number;
  /** Frete hipotético. */
  freightTotal: number;
}

export interface SimulatePurchaseResult {
  newAvgCost: number;
  /** newAvgCost − avgCost (negativo = abaixou). */
  deltaAvgCost: number;
  /** true se a compra abaixa o custo médio atual. */
  worthStocking: boolean;
  qtyInBase: number;
  entryUnitCost: number;
}

export function simulatePurchase(input: SimulatePurchaseInput): SimulatePurchaseResult {
  const { stockQty, avgCost, purchaseQty, toBaseFactor, unitPrice, freightTotal } = input;

  // Reusa as MESMAS funções da compra real (fidelidade total).
  const amounts = computeEntryAmounts({ purchaseQty, toBaseFactor, unitPrice, freightTotal });
  const { newAvgCost } = recalcAvgCost({
    stockQty,
    avgCost,
    entryQtyInBase: amounts.qtyInBase,
    entryUnitCost: amounts.entryUnitCost,
  });

  return {
    newAvgCost,
    deltaAvgCost: newAvgCost - avgCost,
    worthStocking: avgCost > 0 && newAvgCost < avgCost,
    qtyInBase: amounts.qtyInBase,
    entryUnitCost: amounts.entryUnitCost,
  };
}
