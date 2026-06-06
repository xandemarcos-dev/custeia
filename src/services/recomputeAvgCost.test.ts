import { describe, it, expect } from "vitest";
import { recomputeAvgFromEntries } from "./recomputeAvgCost";

describe("recomputeAvgFromEntries — reprocessa o histórico de compras", () => {
  it("reconstrói custo e estoque a partir das entradas em ordem", () => {
    const r = recomputeAvgFromEntries([
      { qtyInBase: 1000, unitCost: 0.02 },
      { qtyInBase: 1000, unitCost: 0.04 },
    ]);
    expect(r.stockQty).toBe(2000);
    expect(r.avgCost).toBeCloseTo(0.03, 6);
    expect(r.snapshots).toHaveLength(2);
    expect(r.snapshots[0].avgCostBefore).toBe(0);
    expect(r.snapshots[0].avgCostAfter).toBeCloseTo(0.02, 6);
    expect(r.snapshots[1].avgCostBefore).toBeCloseTo(0.02, 6);
    expect(r.snapshots[1].avgCostAfter).toBeCloseTo(0.03, 6);
  });

  it("sem compras, zera estoque e custo (ex: após excluir a única compra)", () => {
    const r = recomputeAvgFromEntries([]);
    expect(r.stockQty).toBe(0);
    expect(r.avgCost).toBe(0);
    expect(r.snapshots).toEqual([]);
  });
});
