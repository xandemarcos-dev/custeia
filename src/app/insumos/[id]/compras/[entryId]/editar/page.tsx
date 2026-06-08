import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditEntryForm } from "./EditEntryForm";

export const dynamic = "force-dynamic";

export default async function EditarCompraPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  const { id, entryId } = await params;
  const workspaceId = await requireWorkspaceId();
  const [entry, units] = await Promise.all([
    prisma.ingredientEntry.findFirst({ where: { id: entryId, workspaceId } }),
    prisma.unit.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);
  if (!entry || entry.ingredientId !== id) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Editar compra</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ao salvar, o custo médio do insumo é recalculado.
            </p>
          </CardHeader>
          <CardContent>
            <EditEntryForm
              entry={{
                id: entry.id,
                ingredientId: entry.ingredientId,
                purchaseUnitId: entry.purchaseUnitId,
                purchaseQty: Number(entry.purchaseQty),
                unitPrice: Number(entry.unitPrice),
                freightTotal: Number(entry.freightTotal),
                entryDate: entry.entryDate.toISOString().slice(0, 10),
              }}
              units={units}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
