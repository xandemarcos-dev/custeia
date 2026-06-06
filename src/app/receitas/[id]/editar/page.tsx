import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditRecipeForm } from "./EditRecipeForm";
import { DeleteRecipeButton } from "./DeleteRecipeButton";

export const dynamic = "force-dynamic";

export default async function EditarReceitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [recipe, categories, ingredientsRaw] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id },
      include: { groups: { include: { ingredients: true } } },
    }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.ingredient.findMany({ include: { baseUnit: true }, orderBy: { name: "asc" } }),
  ]);

  if (!recipe) notFound();

  const items = recipe.groups.flatMap((g) =>
    g.ingredients.map((ri) => ({ ingredientId: ri.ingredientId, qtyInBase: Number(ri.qtyInBase) }))
  );
  const ingredients = ingredientsRaw.map((i) => ({
    id: i.id,
    name: i.name,
    baseUnit: i.baseUnit.baseUnit,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Editar produto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Corrija a ficha técnica. Custo e margem recalculam sozinhos.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
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
