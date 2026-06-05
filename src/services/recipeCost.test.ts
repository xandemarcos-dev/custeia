import { describe, it, expect } from "vitest";
import { sumIngredientCost } from "./recipeCost";

describe("sumIngredientCost — custo de insumos de uma receita", () => {
  it("soma quantidade × custo médio de cada item", () => {
    // 1185 g de leite condensado a R$ 0,0201/g + 500 g de chocolate a R$ 0,0389/g
    const total = sumIngredientCost([
      { qtyInBase: 1185, avgCost: 0.0201 },
      { qtyInBase: 500, avgCost: 0.0389 },
    ]);
    // 23,8185 + 19,45 = 43,2685
    expect(total).toBeCloseTo(43.2685, 4);
  });

  it("retorna 0 para receita sem ingredientes", () => {
    expect(sumIngredientCost([])).toBe(0);
  });

  it("recusa quantidade ou custo negativos", () => {
    expect(() => sumIngredientCost([{ qtyInBase: -1, avgCost: 0.02 }])).toThrow();
    expect(() => sumIngredientCost([{ qtyInBase: 100, avgCost: -1 }])).toThrow();
  });
});
