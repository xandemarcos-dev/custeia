import { prisma } from "@/lib/prisma";
import { registerIngredientEntry } from "@/services/registerIngredientEntry";

async function main() {
  // Evita duplicar se já houver dados.
  const existing = await prisma.ingredient.count();
  if (existing > 0) {
    console.log("Já existem dados. Seed ignorado.");
    return;
  }

  const ws = await prisma.workspace.create({
    data: { name: "Day Gruber Doces", ownerId: "00000000-0000-0000-0000-000000000000", slug: "day-gruber" },
  });

  const laticinios = await prisma.category.create({
    data: { workspaceId: ws.id, name: "Laticínios", color: "#c2185b" },
  });
  const chocolates = await prisma.category.create({
    data: { workspaceId: ws.id, name: "Chocolates", color: "#6d4c41" },
  });

  const gr = await prisma.unit.create({
    data: { workspaceId: ws.id, name: "g", baseUnit: "g", toBaseFactor: 1 },
  });
  const kg = await prisma.unit.create({
    data: { workspaceId: ws.id, name: "kg", baseUnit: "g", toBaseFactor: 1000 },
  });
  const caixaLC = await prisma.unit.create({
    data: { workspaceId: ws.id, name: "caixa 395g", baseUnit: "g", toBaseFactor: 395 },
  });

  const leiteCond = await prisma.ingredient.create({
    data: { workspaceId: ws.id, name: "Leite Condensado", brand: "Frimesa", categoryId: laticinios.id, baseUnitId: gr.id },
  });
  const chocoMeio = await prisma.ingredient.create({
    data: { workspaceId: ws.id, name: "Chocolate Meio Amargo", categoryId: chocolates.id, baseUnitId: gr.id },
  });

  // Registra compras de verdade (passando pela ponte → gera custo médio real).
  await registerIngredientEntry({
    workspaceId: ws.id,
    ingredientId: leiteCond.id,
    entryDate: new Date(),
    purchaseUnitId: caixaLC.id,
    purchaseQty: 4,
    unitPrice: 5.29,
    freightTotal: 25,
  });

  await registerIngredientEntry({
    workspaceId: ws.id,
    ingredientId: chocoMeio.id,
    entryDate: new Date(),
    purchaseUnitId: kg.id,
    purchaseQty: 2,
    unitPrice: 38.9,
    freightTotal: 0,
  });

  console.log("Seed concluído ✓");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
