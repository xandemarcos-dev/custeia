/**
 * Zera os DADOS do workspace — receitas, insumos, movimentos, unidades,
 * categorias e fornecedores — sem tocar em workspace, usuários ou login.
 *
 *   pnpm exec tsx scripts/resetWorkspace.ts            ← mostra o que seria apagado
 *   pnpm exec tsx scripts/resetWorkspace.ts --confirmo ← apaga de verdade
 *
 * Útil para recomeçar um ciclo de testes ou reimportar planilhas do zero.
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

const CONFIRM = process.argv.includes("--confirmo");

async function main() {
  const ws = await prisma.workspace.findFirstOrThrow();

  const counts = {
    "Ingredientes de receita": await prisma.recipeIngredient.count({ where: { group: { recipe: { workspaceId: ws.id } } } }),
    "Grupos de receita": await prisma.recipeIngredientGroup.count({ where: { recipe: { workspaceId: ws.id } } }),
    "Receitas": await prisma.recipe.count({ where: { workspaceId: ws.id } }),
    "Categorias de produto": await prisma.productCategory.count({ where: { workspaceId: ws.id } }),
    "Saídas de insumo": await prisma.ingredientExit.count({ where: { workspaceId: ws.id } }),
    "Entradas de insumo": await prisma.ingredientEntry.count({ where: { workspaceId: ws.id } }),
    "Insumos": await prisma.ingredient.count({ where: { workspaceId: ws.id } }),
    "Fornecedores": await prisma.supplier.count({ where: { workspaceId: ws.id } }),
    "Unidades": await prisma.unit.count({ where: { workspaceId: ws.id } }),
    "Categorias de insumo": await prisma.category.count({ where: { workspaceId: ws.id } }),
  };

  console.log(`Workspace: ${ws.name}\n`);
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);

  if (!CONFIRM) {
    console.log("\nNada foi apagado. Para apagar de verdade, rode com --confirmo");
    return;
  }

  // Ordem respeita as FKs: filhos antes dos pais.
  await prisma.$transaction([
    prisma.recipeIngredient.deleteMany({ where: { group: { recipe: { workspaceId: ws.id } } } }),
    prisma.recipeIngredientGroup.deleteMany({ where: { recipe: { workspaceId: ws.id } } }),
    prisma.recipe.deleteMany({ where: { workspaceId: ws.id } }),
    prisma.productCategory.deleteMany({ where: { workspaceId: ws.id } }),
    prisma.ingredientExit.deleteMany({ where: { workspaceId: ws.id } }),
    prisma.ingredientEntry.deleteMany({ where: { workspaceId: ws.id } }),
    prisma.ingredient.deleteMany({ where: { workspaceId: ws.id } }),
    prisma.supplier.deleteMany({ where: { workspaceId: ws.id } }),
    prisma.unit.deleteMany({ where: { workspaceId: ws.id } }),
    prisma.category.deleteMany({ where: { workspaceId: ws.id } }),
  ]);

  console.log("\nWorkspace zerado ✓ (usuários e login intactos)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
