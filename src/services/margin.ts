export interface ComputeMarginInput {
  /** Custo de insumos do lote inteiro (Σ qty × avgCost). */
  ingredientCostBatch: number;
  /** Rendimento em porções. */
  yieldQty: number;
  /** Preço de venda por porção. */
  unitPrice: number;
  /** Custo de embalagem por lote. */
  packagingCost: number;
  /** % de custos fixos sobre o custo de insumos. */
  fixedCostPct: number;
  /** Margem alvo (%). */
  targetMarginPct: number;
}

export interface ComputeMarginResult {
  /** Custo total por porção (insumos + embalagem + fixos). */
  unitCost: number;
  /** Margem real (%). */
  marginPct: number;
  /** marginPct − targetMarginPct (negativo = abaixo da meta). */
  marginGap: number;
  /** Preço que daria a margem alvo com o custo atual. */
  suggestedPrice: number;
  /** true quando a margem está abaixo da meta (alerta). */
  belowTarget: boolean;
}

export function computeMargin(input: ComputeMarginInput): ComputeMarginResult {
  const { ingredientCostBatch, yieldQty, unitPrice, packagingCost, fixedCostPct, targetMarginPct } = input;

  if (yieldQty <= 0) throw new Error("O rendimento (yieldQty) deve ser maior que zero.");
  if (unitPrice <= 0) throw new Error("O preço de venda deve ser maior que zero.");

  // Tudo por porção (mesma unidade do preço de venda).
  const ingredientPerPortion = ingredientCostBatch / yieldQty;
  const packagingPerPortion = packagingCost / yieldQty;
  const fixedPerPortion = ingredientPerPortion * (fixedCostPct / 100);
  const unitCost = ingredientPerPortion + packagingPerPortion + fixedPerPortion;

  const marginPct = ((unitPrice - unitCost) / unitPrice) * 100;
  const marginGap = marginPct - targetMarginPct;

  // Evita divisão por zero se a meta for 100%.
  const suggestedPrice =
    targetMarginPct < 100 ? unitCost / (1 - targetMarginPct / 100) : Infinity;

  return {
    unitCost,
    marginPct,
    marginGap,
    suggestedPrice,
    belowTarget: marginGap < 0,
  };
}
