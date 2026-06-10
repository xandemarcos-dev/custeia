import { prisma } from "@/lib/prisma";

/**
 * Padroniza o símbolo da grama de "gr" para "g" (símbolo correto no SI).
 * Atualiza tanto a unidade chamada "gr" quanto o campo base_unit das
 * unidades de massa. Idempotente.
 */
async function main() {
  const renamed = await prisma.unit.updateMany({
    where: { name: "gr" },
    data: { name: "g" },
  });
  const rebased = await prisma.unit.updateMany({
    where: { baseUnit: "gr" },
    data: { baseUnit: "g" },
  });
  console.log(`Unidades renomeadas (name gr→g): ${renamed.count}`);
  console.log(`Base atualizada (base_unit gr→g): ${rebased.count}`);
  console.log("Padronização concluída ✓");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
