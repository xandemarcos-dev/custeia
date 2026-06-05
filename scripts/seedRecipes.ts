import { prisma } from "@/lib/prisma";

async function main() {
  if ((await prisma.recipe.count()) > 0) {
    console.log("Já existem receitas. Seed ignorado.");
    return;
  }

  const ws = await prisma.workspace.findFirstOrThrow();
  const leite = await prisma.ingredient.findFirstOrThrow({ where: { name: "Leite Condensado" } });
  const choco = await prisma.ingredient.findFirstOrThrow({ where: { name: "Chocolate Meio Amargo" } });

  const cat = await prisma.productCategory.create({
    data: { workspaceId: ws.id, name: "Brigadeiros", color: "#6d4c41" },
  });

  // Brigadeiro Gourmet — receita simples (um grupo).
  const brigadeiro = await prisma.recipe.create({
    data: {
      workspaceId: ws.id,
      name: "Brigadeiro Gourmet",
      categoryId: cat.id,
      yieldQty: 30,
      unitPrice: 3.5,
      targetMarginPct: 60,
      packagingCost: 6,
      fixedCostPct: 30,
    },
  });
  const grupo = await prisma.recipeIngredientGroup.create({
    data: { recipeId: brigadeiro.id, name: "Massa", orderIndex: 0 },
  });
  await prisma.recipeIngredient.createMany({
    data: [
      { groupId: grupo.id, ingredientId: leite.id, qtyInBase: 395, orderIndex: 0 }, // 1 caixa
      { groupId: grupo.id, ingredientId: choco.id, qtyInBase: 200, orderIndex: 1 }, // 200 g
    ],
  });

  console.log("Seed de receitas concluído ✓");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
