import { describe, it, expect } from "vitest";
import { computeMargin } from "./margin";

describe("computeMargin — margem por porção", () => {
  it("calcula custo unitário, margem, gap e preço sugerido", () => {
    const r = computeMargin({
      ingredientCostBatch: 15.72, // Σ qtd × custo (lote)
      yieldQty: 30,
      unitPrice: 3.5,
      packagingCost: 6, // por lote
      fixedCostPct: 30,
      targetMarginPct: 60,
    });

    // insumo/porção 0,524 + embalagem/porção 0,20 + fixo 0,1572 = 0,8812
    expect(r.unitCost).toBeCloseTo(0.8812, 4);
    // (3,50 - 0,8812)/3,50 × 100 ≈ 74,82%
    expect(r.marginPct).toBeCloseTo(74.82, 1);
    expect(r.marginGap).toBeCloseTo(14.82, 1); // acima da meta
    expect(r.belowTarget).toBe(false);
    // 0,8812 / (1 - 0,60) = 2,203
    expect(r.suggestedPrice).toBeCloseTo(2.203, 2);
  });

  it("acende o alerta quando a margem fica abaixo da meta", () => {
    const r = computeMargin({
      ingredientCostBatch: 13.68,
      yieldQty: 20,
      unitPrice: 1.2, // vendido barato demais
      packagingCost: 4,
      fixedCostPct: 30,
      targetMarginPct: 60,
    });
    expect(r.belowTarget).toBe(true);
    expect(r.marginGap).toBeLessThan(0);
    expect(r.suggestedPrice).toBeGreaterThan(1.2); // deveria cobrar mais que o preço atual
  });

  it("recusa preço de venda zero ou negativo", () => {
    expect(() =>
      computeMargin({ ingredientCostBatch: 10, yieldQty: 10, unitPrice: 0, packagingCost: 0, fixedCostPct: 0, targetMarginPct: 50 })
    ).toThrow();
  });
});
