/* Mede a latência do banco e o custo das consultas das páginas principais. */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function time<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  const r = await fn();
  console.log(`${label}: ${(performance.now() - t0).toFixed(0)} ms`);
  return r;
}

async function main() {
  await time("ping (SELECT 1)", () => prisma.$queryRaw`SELECT 1`);
  await time("ping 2 (conexão quente)", () => prisma.$queryRaw`SELECT 1`);

  const ws = await time("workspace.findFirst", () => prisma.workspace.findFirstOrThrow());

  await time("Header: restock count", () =>
    prisma.ingredient.findMany({
      where: { workspaceId: ws.id, minStockQty: { gt: 0 } },
      select: { stockQty: true, minStockQty: true },
    })
  );

  await time("Insumos: lista completa", () =>
    prisma.ingredient.findMany({
      where: { workspaceId: ws.id },
      include: { category: true, baseUnit: true },
      orderBy: { name: "asc" },
    })
  );

  await time("Produtos: receitas + grupos + insumos", () =>
    prisma.recipe.findMany({
      where: { isActive: true, workspaceId: ws.id },
      include: {
        category: true,
        groups: { include: { ingredients: { include: { ingredient: true } } } },
      },
      orderBy: { name: "asc" },
    })
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
