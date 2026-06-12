/**
 * Detecta insumos que ficaram mais caros na ÚLTIMA compra em relação à
 * compra anterior — o sinal honesto de "seu custo subiu". Compara o custo
 * por unidade-base de cada compra (totalCost / qtyInBase), não o avgCost
 * (que dilui o aumento no estoque que já existia).
 *
 * Só sinaliza quando a compra mais recente é razoavelmente nova (recentDays),
 * para o alerta ser "novidade", não história antiga.
 */

export type EntryForAlert = {
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  entryDate: Date;
  totalCost: number;
  qtyInBase: number;
};

export type PriceAlert = {
  ingredientId: string;
  name: string;
  baseUnit: string;
  previousCost: number;
  currentCost: number;
  pctIncrease: number;
};

const costPerBase = (e: EntryForAlert): number =>
  e.qtyInBase > 0 ? e.totalCost / e.qtyInBase : 0;

export function computePriceIncreases(
  entries: EntryForAlert[],
  opts: { recentDays?: number; minPct?: number; now?: Date } = {}
): PriceAlert[] {
  const recentDays = opts.recentDays ?? 60;
  const minPct = opts.minPct ?? 1;
  const now = opts.now ?? new Date();
  const cutoff = now.getTime() - recentDays * 24 * 60 * 60 * 1000;

  // Agrupa por insumo.
  const byIngredient = new Map<string, EntryForAlert[]>();
  for (const e of entries) {
    const list = byIngredient.get(e.ingredientId) ?? [];
    list.push(e);
    byIngredient.set(e.ingredientId, list);
  }

  const alerts: PriceAlert[] = [];
  for (const list of byIngredient.values()) {
    if (list.length < 2) continue;

    // Mais recente primeiro.
    const sorted = [...list].sort(
      (a, b) => b.entryDate.getTime() - a.entryDate.getTime()
    );
    const latest = sorted[0];
    const previous = sorted[1];

    // Só interessa se a última compra é recente.
    if (latest.entryDate.getTime() < cutoff) continue;

    const curr = costPerBase(latest);
    const prev = costPerBase(previous);
    if (prev <= 0 || curr <= prev) continue;

    const pct = ((curr - prev) / prev) * 100;
    if (pct < minPct) continue;

    alerts.push({
      ingredientId: latest.ingredientId,
      name: latest.ingredientName,
      baseUnit: latest.baseUnit,
      previousCost: prev,
      currentCost: curr,
      pctIncrease: pct,
    });
  }

  // Maior aumento primeiro.
  return alerts.sort((a, b) => b.pctIncrease - a.pctIncrease);
}
