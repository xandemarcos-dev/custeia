import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditIngredientForm } from "./EditIngredientForm";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function EditarInsumoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const workspaceId = await requireWorkspaceId();

  const [ingredient, categories, units] = await Promise.all([
    prisma.ingredient.findFirst({ where: { id, workspaceId } }),
    prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    // Unidade base do insumo deve ser ATÔMICA (fator = 1): gr, ml, unidade.
    prisma.unit.findMany({ where: { workspaceId, toBaseFactor: 1 }, orderBy: { name: "asc" } }),
  ]);

  if (!ingredient) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-10">
        <Card>
          <CardHeader>
            <CardTitle>Editar insumo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Corrija os dados. Estoque e custo médio só mudam por compras/saídas.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {erro === "em-uso" && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Este insumo tem compras, saídas ou uso em produtos — não pode ser excluído.
                Você pode editá-lo.
              </p>
            )}

            <EditIngredientForm
              ingredient={{
                id: ingredient.id,
                name: ingredient.name,
                brand: ingredient.brand ?? "",
                categoryId: ingredient.categoryId,
                baseUnitId: ingredient.baseUnitId,
                minStockQty: Number(ingredient.minStockQty),
              }}
              categories={categories}
              units={units}
            />

            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Zona de risco</p>
              <DeleteButton id={ingredient.id} />
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
