/* Diagnóstico: lista ingredientes com avgCost acima de R$1/g — candidatos a erro de importação. */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const ws = await prisma.workspace.findFirstOrThrow();

  // Ingredientes suspeitos: custo > R$1 por unidade base (provavelmente custo/embalagem em vez de custo/g)
  const suspicious = await prisma.ingredient.findMany({
    where: { workspaceId: ws.id, avgCost: { gt: 1 } },
    include: { baseUnit: true },
    orderBy: { avgCost: "desc" },
  });

  console.log(`Ingredientes com avgCost > R$1/${"{baseUnit}"}:\n`);
  for (const i of suspicious) {
    console.log(`  [${i.avgCost}/${i.baseUnit.baseUnit}] ${i.name} ${i.brand ?? ""}`);
  }

  // Mostra também as receitas mais caras por porção para cruzar
  console.log("\nReceitas com custo/porção > R$5 (via cálculo ao vivo):");
  const recipes = await prisma.recipe.findMany({
    where: { workspaceId: ws.id },
    include: { groups: { include: { ingredients: { include: { ingredient: true } } } } },
  });
  for (const r of recipes) {
    let lote = 0;
    for (const g of r.groups)
      for (const ri of g.ingredients) lote += Number(ri.qtyInBase) * Number(ri.ingredient.avgCost);
    const porcao = lote / Number(r.yieldQty);
    if (porcao > 5) console.log(`  ${r.name}: R$${porcao.toFixed(2)}/porção (lote R$${lote.toFixed(2)})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
