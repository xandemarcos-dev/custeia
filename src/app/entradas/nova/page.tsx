import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { dimensionOf } from "@/lib/dimension";
import { NewEntryForm } from "./NewEntryForm";

export const dynamic = "force-dynamic";

export default async function NovaEntradaPage() {
  const workspaceId = await requireWorkspaceId();
  const [ingredients, units, suppliers] = await Promise.all([
    prisma.ingredient.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      include: { baseUnit: true },
    }),
    prisma.unit.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);

  const ingredientOpts = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    dimension: dimensionOf(i.baseUnit.baseUnit),
  }));
  const unitOpts = units.map((u) => ({
    baseUnit: u.baseUnit,
    toBaseFactor: Number(u.toBaseFactor),
    id: u.id,
    name: u.name,
    dimension: dimensionOf(u.baseUnit),
  }));

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Nova compra"
          description="Registre uma entrada de insumo. O custo médio é recalculado automaticamente."
        />
        <Card>
          <CardContent>
            <NewEntryForm
              ingredients={ingredientOpts}
              units={unitOpts}
              suppliers={suppliers.map((s) => s.name)}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
