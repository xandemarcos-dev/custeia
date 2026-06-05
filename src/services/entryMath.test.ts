import { describe, it, expect } from "vitest";
import { computeEntryAmounts } from "./entryMath";

describe("computeEntryAmounts — conversões de uma entrada de compra", () => {
  it("converte unidade de compra para base e calcula custos", () => {
    // 4 caixas de leite condensado (395 g cada), R$ 5,29/caixa, frete R$ 25
    const r = computeEntryAmounts({
      purchaseQty: 4,
      toBaseFactor: 395,
      unitPrice: 5.29,
      freightTotal: 25,
    });

    expect(r.qtyInBase).toBe(1580); // 4 × 395
    expect(r.totalCost).toBeCloseTo(46.16, 2); // (4 × 5,29) + 25
    expect(r.entryUnitCost).toBeCloseTo(0.029215, 6); // 46,16 ÷ 1580
  });

  it("recusa quantidade ou fator inválidos", () => {
    expect(() =>
      computeEntryAmounts({ purchaseQty: 0, toBaseFactor: 395, unitPrice: 5, freightTotal: 0 })
    ).toThrow();
    expect(() =>
      computeEntryAmounts({ purchaseQty: 4, toBaseFactor: 0, unitPrice: 5, freightTotal: 0 })
    ).toThrow();
  });
});
