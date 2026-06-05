import { prisma } from "@/lib/prisma";

async function main() {
  const existe = await prisma.recipe.findFirst({ where: { name: "Trufa Premium" } });
  if (existe) {
    console.log("Trufa Premium já existe. Nada a fazer.");
    return;
  }

  const ws = await prisma.workspace.findFirstOrThrow();
  const leite = await prisma.ingredient.findFirstOrThrow({ where: { name: "Leite Condensado" } });
  const choco = await prisma.ingredient.findFirstOrThrow({ where: { name: "Chocolate Meio Amargo" } });

  let cat = await prisma.productCategory.findFirst({ where: { name: "Trufas" } });
  cat ??= await prisma.productCategory.create({
    data: { workspaceId: ws.id, name: "Trufas", color: "#4e342e" },
  });

  const trufa = await prisma.recipe.create({
    data: {
      workspaceId: ws.id,
      name: "Trufa Premium",
      categoryId: cat.id,
      yieldQty: 20,
      unitPrice: 1.2, // barato demais de propósito
      targetMarginPct: 60,
      packagingCost: 4,
      fixedCostPct: 30,
    },
  });
  const grupo = await prisma.recipeIngredientGroup.create({
    data: { recipeId: trufa.id, name: "Massa", orderIndex: 0 },
  });
  await prisma.recipeIngredient.createMany({
    data: [
      { groupId: grupo.id, ingredientId: choco.id, qtyInBase: 300, orderIndex: 0 },
      { groupId: grupo.id, ingredientId: leite.id, qtyInBase: 100, orderIndex: 1 },
    ],
  });

  console.log("Trufa Premium (mal precificada) criada ✓");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
