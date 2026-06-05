import { prisma } from "@/lib/prisma";
import { registerIngredientEntry } from "@/services/registerIngredientEntry";

async function main() {
  // Cria um cenário mínimo: workspace, categoria, unidades e um ingrediente.
  const ws = await prisma.workspace.create({
    data: { name: "Teste Smoke", ownerId: "00000000-0000-0000-0000-000000000000", slug: "smoke" },
  });
  const cat = await prisma.category.create({
    data: { workspaceId: ws.id, name: "Laticínios", color: "#c2185b" },
  });
  const gr = await prisma.unit.create({
    data: { workspaceId: ws.id, name: "gr", baseUnit: "gr", toBaseFactor: 1 },
  });
  const caixa = await prisma.unit.create({
    data: { workspaceId: ws.id, name: "caixa 395g", baseUnit: "gr", toBaseFactor: 395 },
  });
  const ing = await prisma.ingredient.create({
    data: {
      workspaceId: ws.id,
      name: "Leite Condensado",
      categoryId: cat.id,
      baseUnitId: gr.id,
    },
  });

  // Registra a compra: 4 caixas a R$ 5,29 + R$ 25 de frete.
  const { ingredient } = await registerIngredientEntry({
    workspaceId: ws.id,
    ingredientId: ing.id,
    entryDate: new Date(),
    purchaseUnitId: caixa.id,
    purchaseQty: 4,
    unitPrice: 5.29,
    freightTotal: 25,
  });

  console.log("Estoque (g):", ingredient.stockQty.toString());
  console.log("Custo médio (R$/g):", ingredient.avgCost.toString());
  // Esperado: estoque 1580, custo ≈ 0,029215
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
