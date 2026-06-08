import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeForm } from "./RecipeForm";

export const dynamic = "force-dynamic";

export default async function NovaReceitaPage() {
  const workspaceId = await requireWorkspaceId();
  const [categories, ingredientsRaw] = await Promise.all([
    prisma.productCategory.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.ingredient.findMany({
      where: { workspaceId },
      include: { baseUnit: true },
      orderBy: { name: "asc" },
    }),
  ]);

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
            <CardTitle>Novo produto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Monte a ficha técnica. O custo e a margem são calculados automaticamente.
            </p>
          </CardHeader>
          <CardContent>
            <RecipeForm categories={categories} ingredients={ingredients} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
