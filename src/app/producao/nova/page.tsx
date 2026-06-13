import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { NewProductionForm } from "./NewProductionForm";

export const dynamic = "force-dynamic";

export default async function NovaProducaoPage() {
  const workspaceId = await requireWorkspaceId();

  const recipes = await prisma.recipe.findMany({
    where: { isActive: true, workspaceId },
    include: {
      groups: { include: { ingredients: { include: { ingredient: { include: { baseUnit: true } } } } } },
    },
    orderBy: { name: "asc" },
  });

  // Achata a receita num formato leve para o cliente: cada linha = um insumo
  // consolidado (mesmo que apareça em vários grupos), com estoque atual e
  // custo médio para a prévia ao vivo.
  const recipeOpts = recipes.map((r) => {
    const byIngredient = new Map<
      string,
      { name: string; baseUnit: string; qtyPerBatch: number; stockQty: number; avgCost: number }
    >();
    for (const g of r.groups) {
      for (const ri of g.ingredients) {
        const cur = byIngredient.get(ri.ingredientId);
        const qty = Number(ri.qtyInBase);
        if (cur) {
          cur.qtyPerBatch += qty;
        } else {
          byIngredient.set(ri.ingredientId, {
            name: ri.ingredient.name,
            baseUnit: ri.ingredient.baseUnit.baseUnit,
            qtyPerBatch: qty,
            stockQty: Number(ri.ingredient.stockQty),
            avgCost: Number(ri.ingredient.avgCost),
          });
        }
      }
    }
    return {
      id: r.id,
      name: r.name,
      yieldQty: Number(r.yieldQty),
      items: [...byIngredient.values()],
    };
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Registrar produção"
          description="Informe quantos lotes você produziu. O estoque dos insumos é baixado automaticamente conforme a ficha técnica."
        />
        <Card>
          <CardContent>
            <NewProductionForm recipes={recipeOpts} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
