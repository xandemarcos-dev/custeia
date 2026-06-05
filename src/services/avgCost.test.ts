import { describe, it, expect } from "vitest";
import { recalcAvgCost } from "./avgCost";

describe("recalcAvgCost — custo médio ponderado móvel", () => {
  it("na primeira compra, o custo médio é o custo da entrada", () => {
    // Estoque zerado, primeira compra de leite condensado.
    const resultado = recalcAvgCost({
      stockQty: 0,
      avgCost: 0,
      entryQtyInBase: 1580, // 4 caixas × 395 g
      entryUnitCost: 0.029215, // R$ 46,16 ÷ 1580 g
    });

    expect(resultado.newStockQty).toBe(1580);
    expect(resultado.newAvgCost).toBeCloseTo(0.029215, 6);
  });

  it("pondera pela quantidade quando já existe estoque", () => {
    // 1000 g a R$ 0,02 + 1000 g a R$ 0,04 → média ponderada R$ 0,03
    const resultado = recalcAvgCost({
      stockQty: 1000,
      avgCost: 0.02,
      entryQtyInBase: 1000,
      entryUnitCost: 0.04,
    });

    expect(resultado.newStockQty).toBe(2000);
    expect(resultado.newAvgCost).toBeCloseTo(0.03, 6);
  });

  it("uma compra pequena e cara quase não move o custo médio", () => {
    // 1900 g a R$ 0,02 + 100 g a R$ 0,04 → ~R$ 0,021 (resolve a dúvida da Day)
    const resultado = recalcAvgCost({
      stockQty: 1900,
      avgCost: 0.02,
      entryQtyInBase: 100,
      entryUnitCost: 0.04,
    });

    expect(resultado.newAvgCost).toBeCloseTo(0.021, 6);
  });

  it("recusa quantidade de entrada zero ou negativa", () => {
    expect(() =>
      recalcAvgCost({ stockQty: 100, avgCost: 0.02, entryQtyInBase: 0, entryUnitCost: 0.04 })
    ).toThrow();
  });

  it("recusa custo de entrada negativo", () => {
    expect(() =>
      recalcAvgCost({ stockQty: 100, avgCost: 0.02, entryQtyInBase: 50, entryUnitCost: -1 })
    ).toThrow();
  });
});
