import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditUnitForm } from "./EditUnitForm";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function EditarUnidadePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;

  const [unit, asBase, asPurchase] = await Promise.all([
    prisma.unit.findUnique({ where: { id } }),
    prisma.ingredient.count({ where: { baseUnitId: id } }),
    prisma.ingredientEntry.count({ where: { purchaseUnitId: id } }),
  ]);

  if (!unit) notFound();

  const inUse = asBase + asPurchase > 0;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Editar unidade</CardTitle>
            <p className="text-sm text-muted-foreground">
              Corrija os dados da unidade de medida.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {erro === "em-uso" && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Esta unidade está em uso em insumos ou compras — não pode ser excluída.
                Você pode editar o nome.
              </p>
            )}

            <EditUnitForm
              unit={{
                id: unit.id,
                name: unit.name,
                baseUnit: unit.baseUnit,
                toBaseFactor: Number(unit.toBaseFactor),
              }}
              inUse={inUse}
            />

            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Zona de risco</p>
              <DeleteButton id={unit.id} inUse={inUse} />
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
