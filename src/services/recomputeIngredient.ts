import { prisma } from "@/lib/prisma";
import { recomputeAvgFromEntries } from "./recomputeAvgCost";

/** Reprocessa estoque/custo de um insumo a partir de TODAS as suas entradas e saídas. */
export async function recomputeIngredient(workspaceId: string, ingredientId: string): Promise<void> {
  const entries = await prisma.ingredientEntry.findMany({
    where: { ingredientId, workspaceId },
    orderBy: [{ entryDate: "asc" }, { id: "asc" }],
  });

  const events = entries.map((e) => ({
    qtyInBase: Number(e.qtyInBase),
    unitCost: Number(e.totalCost) / Number(e.qtyInBase),
  }));

  const { stockQty, avgCost, snapshots } = recomputeAvgFromEntries(events);

  // Desconta saídas (produção, ajustes) do estoque calculado pelas entradas.
  const exits = await prisma.ingredientExit.findMany({
    where: { ingredientId, workspaceId },
    select: { qtyInBase: true },
  });

  const totalExits = exits.reduce((sum, ex) => sum + Number(ex.qtyInBase), 0);
  const finalStock = stockQty - totalExits;

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
      data: { stockQty: finalStock, avgCost },
    }),
  ]);
}
