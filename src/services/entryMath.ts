export interface ComputeEntryAmountsInput {
  /** Quantidade na unidade de compra (ex: 4 caixas). */
  purchaseQty: number;
  /** Fator da unidade de compra para a base (ex: caixa→gr = 395). */
  toBaseFactor: number;
  /** Preço por unidade de compra (ex: R$ 5,29 por caixa). */
  unitPrice: number;
  /** Frete total rateado nesta compra. */
  freightTotal: number;
}

export interface ComputeEntryAmountsResult {
  /** Quantidade convertida para a unidade base (ex: 1580 g). */
  qtyInBase: number;
  /** Custo total: (purchaseQty × unitPrice) + freightTotal. */
  totalCost: number;
  /** Custo por unidade base: totalCost ÷ qtyInBase. */
  entryUnitCost: number;
}

export function computeEntryAmounts(
  input: ComputeEntryAmountsInput
): ComputeEntryAmountsResult {
  const { purchaseQty, toBaseFactor, unitPrice, freightTotal } = input;

  if (purchaseQty <= 0) throw new Error("purchaseQty deve ser maior que zero.");
  if (toBaseFactor <= 0) throw new Error("toBaseFactor deve ser maior que zero.");
  if (unitPrice < 0 || freightTotal < 0) {
    throw new Error("Preço e frete não podem ser negativos.");
  }

  const qtyInBase = purchaseQty * toBaseFactor;
  const totalCost = purchaseQty * unitPrice + freightTotal;
  const entryUnitCost = totalCost / qtyInBase;

  return { qtyInBase, totalCost, entryUnitCost };
}
