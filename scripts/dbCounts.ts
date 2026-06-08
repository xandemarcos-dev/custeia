import { prisma } from "@/lib/prisma";

async function main() {
  const [
    workspaces,
    users,
    categories,
    productCategories,
    units,
    suppliers,
    ingredients,
    entries,
    exits,
    recipes,
    recipeGroups,
    recipeIngredients,
  ] = await Promise.all([
    prisma.workspace.count(),
    prisma.user.count(),
    prisma.category.count(),
    prisma.productCategory.count(),
    prisma.unit.count(),
    prisma.supplier.count(),
    prisma.ingredient.count(),
    prisma.ingredientEntry.count(),
    prisma.ingredientExit.count(),
    prisma.recipe.count(),
    prisma.recipeIngredientGroup.count(),
    prisma.recipeIngredient.count(),
  ]);

  console.log("=== Contagem atual do banco ===");
  console.log("Workspaces:          ", workspaces);
  console.log("Usuários:            ", users);
  console.log("Categorias (insumo): ", categories);
  console.log("Categorias (produto):", productCategories);
  console.log("Unidades:            ", units);
  console.log("Fornecedores:        ", suppliers);
  console.log("Insumos:             ", ingredients);
  console.log("Entradas (compras):  ", entries);
  console.log("Saídas:              ", exits);
  console.log("Receitas:            ", recipes);
  console.log("Grupos de receita:   ", recipeGroups);
  console.log("Itens de receita:    ", recipeIngredients);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
