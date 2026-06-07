import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewIngredientForm } from "./NewIngredientForm";

export const dynamic = "force-dynamic";

export default async function NovoInsumoPage() {
  const [categories, units] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    // Unidade base do insumo deve ser ATÔMICA (fator de conversão = 1): gr, ml, unidade.
    prisma.unit.findMany({ where: { toBaseFactor: 1 }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Novo insumo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Cadastre um insumo. O custo médio aparece depois da primeira compra.
            </p>
          </CardHeader>
          <CardContent>
            <NewIngredientForm categories={categories} units={units} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
