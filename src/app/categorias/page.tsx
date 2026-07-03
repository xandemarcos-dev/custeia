import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCategoryForm } from "./AddCategoryForm";
import { deleteCategoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const workspaceId = await requireWorkspaceId();
  const { erro } = await searchParams;

  const categories = await prisma.category.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    include: { _count: { select: { ingredients: true } } },
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Categorias de insumos"
          description="Agrupe seus insumos por tipo para facilitar a navegação."
        />

        {erro === "em-uso" && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            Não é possível excluir uma categoria que possui insumos vinculados.
          </div>
        )}

        {erro === "nao-encontrada" && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            Categoria não encontrada ou já foi excluída.
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Adicionar categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <AddCategoryForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma categoria ainda. Adicione a primeira acima.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {categories.map((cat) => (
                  <li key={cat.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium text-sm">{cat.name}</span>
                      {cat._count.ingredients > 0 && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {cat._count.ingredients} insumo{cat._count.ingredients !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <form action={deleteCategoryAction} className="shrink-0">
                      <input type="hidden" name="id" value={cat.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
                        disabled={cat._count.ingredients > 0}
                        title={
                          cat._count.ingredients > 0
                            ? "Categoria em uso — remova os insumos primeiro"
                            : "Excluir categoria"
                        }
                      >
                        Excluir
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
