import { recalcAvgCost } from "./avgCost";

export interface EntryEvent {
  qtyInBase: number;
  /** Custo por unidade base desta entrada (totalCost / qtyInBase). */
  unitCost: number;
}

export interface RecomputeResult {
  stockQty: number;
  avgCost: number;
  /** Snapshots por entrada, na mesma ordem da lista recebida. */
  snapshots: { avgCostBefore: number; avgCostAfter: number }[];
}

/** Reprocessa o custo médio a partir das entradas, em ordem cronológica. */
export function recomputeAvgFromEntries(entries: EntryEvent[]): RecomputeResult {
  let stockQty = 0;
  let avgCost = 0;
  const snapshots: { avgCostBefore: number; avgCostAfter: number }[] = [];

  for (const e of entries) {
    const before = avgCost;
    const res = recalcAvgCost({
      stockQty,
      avgCost,
      entryQtyInBase: e.qtyInBase,
      entryUnitCost: e.unitCost,
    });
    stockQty = res.newStockQty;
    avgCost = res.newAvgCost;
    snapshots.push({ avgCostBefore: before, avgCostAfter: avgCost });
  }

  return { stockQty, avgCost, snapshots };
}
