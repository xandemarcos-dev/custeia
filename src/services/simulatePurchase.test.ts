import { describe, it, expect } from "vitest";
import { simulatePurchase } from "./simulatePurchase";

describe("simulatePurchase — impacto de uma compra hipotética", () => {
  it("calcula novo custo médio, variação e se vale estocar", () => {
    const r = simulatePurchase({
      stockQty: 1000,
      avgCost: 0.02,
      purchaseQty: 1000,
      toBaseFactor: 1,
      unitPrice: 0.01,
      freightTotal: 0,
    });
    expect(r.newAvgCost).toBeCloseTo(0.015, 6);
    expect(r.deltaAvgCost).toBeCloseTo(-0.005, 6);
    expect(r.worthStocking).toBe(true);
  });

  it("marca como não-vantajoso quando a compra encarece a média", () => {
    const r = simulatePurchase({
      stockQty: 1000,
      avgCost: 0.02,
      purchaseQty: 1000,
      toBaseFactor: 1,
      unitPrice: 0.04,
      freightTotal: 0,
    });
    expect(r.newAvgCost).toBeCloseTo(0.03, 6);
    expect(r.deltaAvgCost).toBeGreaterThan(0);
    expect(r.worthStocking).toBe(false);
  });

  it("recusa quantidade inválida", () => {
    expect(() =>
      simulatePurchase({ stockQty: 100, avgCost: 0.02, purchaseQty: 0, toBaseFactor: 1, unitPrice: 0.01, freightTotal: 0 })
    ).toThrow();
  });
});
