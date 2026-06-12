import { describe, it, expect } from "vitest";
import { computePriceIncreases, type EntryForAlert } from "./priceAlerts";

const NOW = new Date("2026-06-12");
const days = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

function entry(p: Partial<EntryForAlert>): EntryForAlert {
  return {
    ingredientId: "i1",
    ingredientName: "Chocolate",
    baseUnit: "g",
    entryDate: days(1),
    totalCost: 100,
    qtyInBase: 1000,
    ...p,
  };
}

describe("computePriceIncreases", () => {
  it("sinaliza aumento na última compra vs a anterior", () => {
    const entries = [
      entry({ entryDate: days(40), totalCost: 100, qtyInBase: 1000 }), // 0,10/g
      entry({ entryDate: days(2), totalCost: 114, qtyInBase: 1000 }), // 0,114/g
    ];
    const [a] = computePriceIncreases(entries, { now: NOW });
    expect(a.pctIncrease).toBeCloseTo(14, 5);
    expect(a.previousCost).toBeCloseTo(0.1, 5);
    expect(a.currentCost).toBeCloseTo(0.114, 5);
  });

  it("ignora quando a última compra ficou mais barata", () => {
    const entries = [
      entry({ entryDate: days(40), totalCost: 120, qtyInBase: 1000 }),
      entry({ entryDate: days(2), totalCost: 100, qtyInBase: 1000 }),
    ];
    expect(computePriceIncreases(entries, { now: NOW })).toHaveLength(0);
  });

  it("ignora aumento antigo (última compra fora da janela recente)", () => {
    const entries = [
      entry({ entryDate: days(200), totalCost: 100, qtyInBase: 1000 }),
      entry({ entryDate: days(120), totalCost: 130, qtyInBase: 1000 }),
    ];
    expect(computePriceIncreases(entries, { now: NOW, recentDays: 60 })).toHaveLength(0);
  });

  it("ignora insumo com uma única compra", () => {
    expect(computePriceIncreases([entry({})], { now: NOW })).toHaveLength(0);
  });

  it("normaliza por unidade-base (quantidades diferentes)", () => {
    const entries = [
      entry({ entryDate: days(40), totalCost: 100, qtyInBase: 1000 }), // 0,10/g
      entry({ entryDate: days(2), totalCost: 220, qtyInBase: 2000 }), // 0,11/g
    ];
    const [a] = computePriceIncreases(entries, { now: NOW });
    expect(a.pctIncrease).toBeCloseTo(10, 5);
  });

  it("ordena do maior aumento para o menor", () => {
    const entries = [
      entry({ ingredientId: "a", ingredientName: "A", entryDate: days(40), totalCost: 100, qtyInBase: 1000 }),
      entry({ ingredientId: "a", ingredientName: "A", entryDate: days(2), totalCost: 105, qtyInBase: 1000 }),
      entry({ ingredientId: "b", ingredientName: "B", entryDate: days(40), totalCost: 100, qtyInBase: 1000 }),
      entry({ ingredientId: "b", ingredientName: "B", entryDate: days(2), totalCost: 130, qtyInBase: 1000 }),
    ];
    const result = computePriceIncreases(entries, { now: NOW });
    expect(result.map((r) => r.name)).toEqual(["B", "A"]);
  });
});
