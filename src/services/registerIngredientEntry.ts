import { prisma } from "@/lib/prisma";
import { computeEntryAmounts } from "./entryMath";
import { recalcAvgCost } from "./avgCost";
import { dimensionOf, dimensionLabel } from "@/lib/dimension";

export interface RegisterEntryInput {
  workspaceId: string;
  ingredientId: string;
  supplierId?: string | null;
  entryDate: Date;
  purchaseUnitId: string;
  purchaseQty: number;
  unitPrice: number;
  freightTotal?: number;
  notes?: string | null;
}

// INVARIANTE DE ESTOQUE: ingredient.stockQty = Σ IngredientEntry.qtyInBase − Σ IngredientExit.qtyInBase
// Esta função confia que o valor atual em DB já está exits-ajustado (registerProduction faz decrement
// atômico e cria IngredientExit simultaneamente; recomputeIngredient reconstrói do zero com a mesma fórmula).
// Qualquer outro caminho que altere stockQty DEVE criar um IngredientExit correspondente ou chamar recomputeIngredient.

/**
 * Registra uma compra de insumo e, atomicamente, recalcula e grava
 * o estoque e o custo médio do ingrediente.
 */
export async function registerIngredientEntry(input: RegisterEntryInput) {
  return prisma.$transaction(async (tx) => {
    // 1. Lê o ingrediente (estado atual + unidade base, para checar dimensão).
    const ingredient = await tx.ingredient.findUniqueOrThrow({
      where: { id: input.ingredientId },
      include: { baseUnit: true },
    });

    // 2. Lê a unidade de compra (para o fator de conversão).
    const purchaseUnit = await tx.unit.findUniqueOrThrow({
      where: { id: input.purchaseUnitId },
    });

    // 2b. Consistência de dimensão (R6): não dá para comprar em volume um
    // insumo medido em massa, etc. Evita corromper qtyInBase silenciosamente.
    const ingDim = dimensionOf(ingredient.baseUnit.baseUnit);
    const buyDim = dimensionOf(purchaseUnit.baseUnit);
    if (ingDim !== buyDim) {
      throw new Error(
        `Unidade incompatível: o insumo é medido em ${dimensionLabel(ingDim)} ` +
          `e a unidade de compra "${purchaseUnit.name}" é de ${dimensionLabel(buyDim)}.`
      );
    }

    // 3. Converte e calcula os valores da entrada (função pura testada).
    const amounts = computeEntryAmounts({
      purchaseQty: input.purchaseQty,
      toBaseFactor: Number(purchaseUnit.toBaseFactor),
      unitPrice: input.unitPrice,
      freightTotal: input.freightTotal ?? 0,
    });

    // 4. Recalcula o custo médio ponderado móvel (função pura testada).
    const avgBefore = Number(ingredient.avgCost);
    const { newStockQty, newAvgCost } = recalcAvgCost({
      stockQty: Number(ingredient.stockQty),
      avgCost: avgBefore,
      entryQtyInBase: amounts.qtyInBase,
      entryUnitCost: amounts.entryUnitCost,
    });

    // 5. Cria o registro da entrada, com os snapshots de auditoria.
    const entry = await tx.ingredientEntry.create({
      data: {
        workspaceId: input.workspaceId,
        ingredientId: input.ingredientId,
        supplierId: input.supplierId ?? null,
        entryDate: input.entryDate,
        purchaseUnitId: input.purchaseUnitId,
        purchaseQty: input.purchaseQty,
        unitPrice: input.unitPrice,
        freightTotal: input.freightTotal ?? 0,
        qtyInBase: amounts.qtyInBase,
        totalCost: amounts.totalCost,
        avgCostBefore: avgBefore,
        avgCostAfter: newAvgCost,
        notes: input.notes ?? null,
      },
    });

    // 6. Atualiza o ingrediente (a "regra de ouro": só muda por aqui).
    const updated = await tx.ingredient.update({
      where: { id: input.ingredientId },
      data: {
        stockQty: newStockQty,
        avgCost: newAvgCost,
      },
    });

    return { entry, ingredient: updated };
  });
}
