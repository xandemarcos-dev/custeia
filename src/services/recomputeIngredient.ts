import { prisma } from "@/lib/prisma";
import { recomputeAvgFromEntries } from "./recomputeAvgCost";

/** Reprocessa estoque/custo de um insumo a partir de TODAS as suas entradas. */
export async function recomputeIngredient(ingredientId: string): Promise<void> {
  const entries = await prisma.ingredientEntry.findMany({
    where: { ingredientId },
    orderBy: [{ entryDate: "asc" }, { id: "asc" }],
  });

  const events = entries.map((e) => ({
    qtyInBase: Number(e.qtyInBase),
    unitCost: Number(e.totalCost) / Number(e.qtyInBase),
  }));

  const { stockQty, avgCost, snapshots } = recomputeAvgFromEntries(events);

  await prisma.$transaction([
    ...entries.map((e, i) =>
      prisma.ingredientEntry.update({
        where: { id: e.id },
        data: {
          avgCostBefore: snapshots[i].avgCostBefore,
          avgCostAfter: snapshots[i].avgCostAfter,
        },
      })
    ),
    prisma.ingredient.update({
      where: { id: ingredientId },
      data: { stockQty, avgCost },
    }),
  ]);
}
