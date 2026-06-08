import { prisma } from "@/lib/prisma";

/**
 * Garante que cada workspace tenha as unidades essenciais.
 * Idempotente: só cria as que faltam (por nome, ignorando caixa).
 *
 * Bases canônicas (fator 1): gr (massa), ml (volume), un (contagem).
 * Derivadas comuns: kg, L, dúzia.
 */
const DEFAULTS: { name: string; baseUnit: string; toBaseFactor: number }[] = [
  { name: "gr", baseUnit: "gr", toBaseFactor: 1 },
  { name: "ml", baseUnit: "ml", toBaseFactor: 1 },
  { name: "un", baseUnit: "un", toBaseFactor: 1 },
  { name: "kg", baseUnit: "gr", toBaseFactor: 1000 },
  { name: "L", baseUnit: "ml", toBaseFactor: 1000 },
  { name: "dúzia", baseUnit: "un", toBaseFactor: 12 },
];

async function main() {
  const workspaces = await prisma.workspace.findMany({ select: { id: true, name: true } });

  for (const ws of workspaces) {
    const existing = await prisma.unit.findMany({
      where: { workspaceId: ws.id },
      select: { name: true },
    });
    const have = new Set(existing.map((u) => u.name.trim().toLowerCase()));

    let created = 0;
    for (const d of DEFAULTS) {
      if (have.has(d.name.trim().toLowerCase())) continue;
      await prisma.unit.create({ data: { workspaceId: ws.id, ...d } });
      created++;
      console.log(`  + ${d.name} (${d.baseUnit}, ${d.toBaseFactor})`);
    }
    console.log(`Workspace "${ws.name}": ${created} unidade(s) criada(s).`);
  }

  console.log("\nSeed de unidades concluído ✓");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
