import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { NewIngredientForm } from "./NewIngredientForm";

export const dynamic = "force-dynamic";

export default async function NovoInsumoPage() {
  const workspaceId = await requireWorkspaceId();
  const [categories, units] = await Promise.all([
    prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    // Unidade base do insumo deve ser ATÔMICA (fator de conversão = 1): gr, ml, unidade.
    prisma.unit.findMany({ where: { workspaceId, toBaseFactor: 1 }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Novo insumo"
          description="Cadastre um insumo. O custo médio aparece depois da primeira compra."
        />
        <Card>
          <CardContent>
            <NewIngredientForm categories={categories} units={units} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
