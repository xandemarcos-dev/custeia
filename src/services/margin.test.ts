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

    // (insumos 15,72 + embalagem 6) × 1,30 = 28,236 ÷ 30 = 0,9412
    expect(r.unitCost).toBeCloseTo(0.9412, 4);
    // (3,50 - 0,9412)/3,50 × 100 ≈ 73,11%
    expect(r.marginPct).toBeCloseTo(73.11, 1);
    expect(r.marginGap).toBeCloseTo(13.11, 1); // acima da meta
    expect(r.belowTarget).toBe(false);
    // 0,9412 / (1 - 0,60) = 2,353
    expect(r.suggestedPrice).toBeCloseTo(2.353, 2);
  });

  it("bate com o gabarito da planilha da Day — Brigadeiro Ninho", () => {
    const r = computeMargin({
      ingredientCostBatch: 11.075,
      yieldQty: 28,
      unitPrice: 2,
      packagingCost: 4.48,
      fixedCostPct: 30,
      targetMarginPct: 50,
    });
    // (11,075 + 4,48) × 1,30 = 20,2215 ÷ 28 = 0,7222
    expect(r.unitCost).toBeCloseTo(0.7222, 4);
    expect(r.marginPct).toBeCloseTo(63.9, 1);
    expect(r.belowTarget).toBe(false);
  });

  it("bate com o gabarito da planilha da Day — Tradicional ao Leite", () => {
    const r = computeMargin({
      ingredientCostBatch: 23.804,
      yieldQty: 32,
      unitPrice: 2,
      packagingCost: 5.12,
      fixedCostPct: 30,
      targetMarginPct: 50,
    });
    // (23,804 + 5,12) × 1,30 = 37,6012 ÷ 32 = 1,1750
    expect(r.unitCost).toBeCloseTo(1.175, 3);
    expect(r.marginPct).toBeCloseTo(41.2, 1);
    expect(r.belowTarget).toBe(true);
    // 1,1750 / 0,5 = 2,35
    expect(r.suggestedPrice).toBeCloseTo(2.35, 2);
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
