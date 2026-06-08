import { prisma } from "@/lib/prisma";

/**
 * Saneamento OPERACIONAL: apaga dados transacionais para começar do zero,
 * preservando a configuração (workspace, unidades, categorias, fornecedores).
 *
 * Apaga (na ordem de dependência das FKs):
 *   recipe_ingredients → recipe_ingredient_groups → recipes
 *   ingredient_exits → ingredient_entries → ingredients
 *
 * Mantém: workspaces, users, categories, product_categories, units, suppliers.
 */
async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const recipeIngredients = await tx.recipeIngredient.deleteMany({});
    const recipeGroups = await tx.recipeIngredientGroup.deleteMany({});
    const recipes = await tx.recipe.deleteMany({});
    const exits = await tx.ingredientExit.deleteMany({});
    const entries = await tx.ingredientEntry.deleteMany({});
    const ingredients = await tx.ingredient.deleteMany({});
    return { recipeIngredients, recipeGroups, recipes, exits, entries, ingredients };
  });

  console.log("=== Saneamento operacional concluído ===");
  console.log("Itens de receita apagados:", result.recipeIngredients.count);
  console.log("Grupos de receita:        ", result.recipeGroups.count);
  console.log("Receitas:                 ", result.recipes.count);
  console.log("Saídas:                   ", result.exits.count);
  console.log("Compras:                  ", result.entries.count);
  console.log("Insumos:                  ", result.ingredients.count);
  console.log("\nConfig preservada: workspace, unidades, categorias, fornecedores ✓");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
