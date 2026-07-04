import { prisma } from "@/lib/prisma";

export interface RegisterManualExitInput {
  workspaceId: string;
  ingredientId: string;
  qtyInBase: number;
  source: "adjustment" | "waste" | "other";
  exitDate: Date;
  notes?: string | null;
}

export async function registerManualExit(input: RegisterManualExitInput) {
  if (!(input.qtyInBase > 0)) throw new Error("A quantidade deve ser maior que zero.");

  return prisma.$transaction(async (tx) => {
    const ingredient = await tx.ingredient.findFirst({
      where: { id: input.ingredientId, workspaceId: input.workspaceId },
      select: { id: true, name: true, stockQty: true, avgCost: true },
    });
    if (!ingredient) throw new Error("Insumo não encontrado.");

    if (Number(ingredient.stockQty) < input.qtyInBase) {
      throw new Error(
        `Estoque insuficiente — tem ${Number(ingredient.stockQty)}, saída solicitada ${input.qtyInBase}.`
      );
    }

    await tx.ingredientExit.create({
      data: {
        workspaceId: input.workspaceId,
        ingredientId: input.ingredientId,
        exitDate: input.exitDate,
        qtyInBase: input.qtyInBase,
        unitCost: ingredient.avgCost,
        source: input.source,
        notes: input.notes ?? null,
      },
    });

    await tx.ingredient.update({
      where: { id: input.ingredientId },
      data: { stockQty: { decrement: input.qtyInBase } },
    });
  });
}
