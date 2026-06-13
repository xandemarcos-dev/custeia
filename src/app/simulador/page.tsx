import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { dimensionOf } from "@/lib/dimension";
import { SimuladorForm } from "./SimuladorForm";

export const dynamic = "force-dynamic";

export default async function SimuladorPage() {
  const workspaceId = await requireWorkspaceId();
  const [ingredients, units] = await Promise.all([
    prisma.ingredient.findMany({ where: { workspaceId }, orderBy: { name: "asc" }, include: { baseUnit: true } }),
    prisma.unit.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);

  const ingredientOpts = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    dimension: dimensionOf(i.baseUnit.baseUnit),
  }));
  const unitOpts = units.map((u) => ({
    id: u.id,
    name: u.name,
    dimension: dimensionOf(u.baseUnit),
    baseUnit: u.baseUnit,
    toBaseFactor: Number(u.toBaseFactor),
  }));

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Simulador de compra"
          description="Veja o impacto de uma compra no custo médio e na margem — sem registrar nada."
        />
        <Card>
          <CardContent>
            <SimuladorForm ingredients={ingredientOpts} units={unitOpts} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
