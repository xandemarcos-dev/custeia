/* Verificação pós-importação: confere o Tradicional ao Leite contra o gabarito. */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { computeMargin } from "@/services/margin";

async function main() {
  const r = await prisma.recipe.findFirstOrThrow({
    where: { name: "Tradicional ao Leite" },
    include: { groups: { include: { ingredients: { include: { ingredient: true } } } } },
  });
  let cost = 0;
  for (const g of r.groups)
    for (const ri of g.ingredients) cost += Number(ri.qtyInBase) * Number(ri.ingredient.avgCost);

  const m = computeMargin({
    ingredientCostBatch: cost,
    yieldQty: Number(r.yieldQty),
    unitPrice: Number(r.unitPrice),
    packagingCost: Number(r.packagingCost),
    fixedCostPct: Number(r.fixedCostPct),
    targetMarginPct: Number(r.targetMarginPct),
  });

  console.log("grupos:", r.groups.map((g) => `${g.name}(${g.ingredients.length})`).join(", "));
  console.log(
    `insumos lote: R$ ${cost.toFixed(3)} | custo/un: R$ ${m.unitCost.toFixed(4)} | ` +
      `margem: ${m.marginPct.toFixed(1)}% | sugerido: R$ ${m.suggestedPrice.toFixed(2)}`
  );

  const [ing, rec, ent] = await Promise.all([
    prisma.ingredient.count(),
    prisma.recipe.count(),
    prisma.ingredientEntry.count(),
  ]);
  console.log(`totais → insumos: ${ing} | receitas: ${rec} | entradas (saldos): ${ent}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
