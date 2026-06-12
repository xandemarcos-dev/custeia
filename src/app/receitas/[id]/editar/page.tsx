import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { formatBRL } from "@/lib/format";
import { computeMargin } from "@/services/margin";
import { sumIngredientCost } from "@/services/recipeCost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditRecipeForm } from "./EditRecipeForm";
import { DeleteRecipeButton } from "./DeleteRecipeButton";

export const dynamic = "force-dynamic";

export default async function EditarReceitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspaceId = await requireWorkspaceId();

  const [recipe, categories, ingredientsRaw] = await Promise.all([
    prisma.recipe.findFirst({
      where: { id, workspaceId },
      include: { groups: { include: { ingredients: true } } },
    }),
    prisma.productCategory.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.ingredient.findMany({ where: { workspaceId }, include: { baseUnit: true }, orderBy: { name: "asc" } }),
  ]);

  if (!recipe) notFound();

  const items = recipe.groups.flatMap((g) =>
    g.ingredients.map((ri) => ({ ingredientId: ri.ingredientId, qtyInBase: Number(ri.qtyInBase) }))
  );
  const avgCostById = new Map(ingredientsRaw.map((i) => [i.id, Number(i.avgCost)]));
  const custoLote = sumIngredientCost(
    items.map((it) => ({ qtyInBase: it.qtyInBase, avgCost: avgCostById.get(it.ingredientId) ?? 0 }))
  );
  const margem =
    Number(recipe.unitPrice) > 0 && Number(recipe.yieldQty) > 0
      ? computeMargin({
          ingredientCostBatch: custoLote,
          yieldQty: Number(recipe.yieldQty),
          unitPrice: Number(recipe.unitPrice),
          packagingCost: Number(recipe.packagingCost),
          fixedCostPct: Number(recipe.fixedCostPct),
          targetMarginPct: Number(recipe.targetMarginPct),
        })
      : null;

  const ingredients = ingredientsRaw.map((i) => ({
    id: i.id,
    name: i.name,
    baseUnit: i.baseUnit.baseUnit,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <Card>
          <CardHeader>
            <CardTitle>Editar produto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Corrija a ficha técnica. Custo e margem recalculam sozinhos.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {margem && (
              <div
                className={`rounded-md border px-4 py-3 text-sm ${
                  margem.belowTarget
                    ? "border-destructive/30 bg-destructive/10"
                    : "border-emerald-500/30 bg-emerald-500/10"
                }`}
              >
                <p className="font-medium">
                  Para a margem alvo de {Number(recipe.targetMarginPct)}%, venda a{" "}
                  {formatBRL(margem.suggestedPrice, 2)}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Hoje: custo {formatBRL(margem.unitCost, 2)}/un · preço{" "}
                  {formatBRL(Number(recipe.unitPrice), 2)} · margem real{" "}
                  {margem.marginPct.toFixed(1)}%
                  {margem.belowTarget ? " — abaixo da meta" : " — acima da meta"}
                </p>
              </div>
            )}
            <EditRecipeForm
              recipe={{
                id: recipe.id,
                name: recipe.name,
                categoryId: recipe.categoryId,
                yieldQty: Number(recipe.yieldQty),
                unitPrice: Number(recipe.unitPrice),
                targetMarginPct: Number(recipe.targetMarginPct),
                packagingCost: Number(recipe.packagingCost),
                fixedCostPct: Number(recipe.fixedCostPct),
                items,
              }}
              categories={categories}
              ingredients={ingredients}
            />
            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Zona de risco</p>
              <DeleteRecipeButton id={recipe.id} />
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
