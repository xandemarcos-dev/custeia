import { prisma } from "@/lib/prisma";

/**
 * Remove unidades duplicadas (mesmo nome, ignorando caixa/espaços) por workspace.
 * Mantém a que estiver em uso (mais referências em compras + insumos);
 * em empate, mantém a primeira. Só apaga duplicatas sem nenhuma referência.
 */
async function main() {
  const units = await prisma.unit.findMany({
    include: {
      _count: { select: { ingredientEntries: true, ingredients: true } },
    },
  });

  const groups = new Map<string, typeof units>();
  for (const u of units) {
    const key = `${u.workspaceId}::${u.name.trim().toLowerCase()}`;
    const arr = groups.get(key) ?? [];
    arr.push(u);
    groups.set(key, arr);
  }

  let removed = 0;
  for (const [key, arr] of groups) {
    if (arr.length < 2) continue;

    // Ordena por uso (desc): o primeiro é o que mantemos.
    arr.sort(
      (a, b) =>
        b._count.ingredientEntries + b._count.ingredients -
        (a._count.ingredientEntries + a._count.ingredients)
    );
    const keep = arr[0];
    const dups = arr.slice(1);

    console.log(`Grupo "${key}": ${arr.length} unidades. Mantendo ${keep.id} (${keep.name}).`);

    for (const d of dups) {
      const refs = d._count.ingredientEntries + d._count.ingredients;
      if (refs > 0) {
        console.log(`  ⚠️  ${d.id} tem ${refs} referência(s) — NÃO removido (evita quebrar dados).`);
        continue;
      }
      await prisma.unit.delete({ where: { id: d.id } });
      removed++;
      console.log(`  🗑️  removido ${d.id} (sem uso).`);
    }
  }

  console.log(`\nConcluído. ${removed} unidade(s) duplicada(s) removida(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
