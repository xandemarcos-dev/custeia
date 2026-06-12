import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { formatBRL } from "@/lib/format";
import { sumIngredientCost } from "@/services/recipeCost";
import { computeMargin } from "@/services/margin";
import { Header } from "@/components/Header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ReceitasPage() {
  const workspaceId = await requireWorkspaceId();
  const recipes = await prisma.recipe.findMany({
    where: { isActive: true, workspaceId },
    include: {
      category: true,
      groups: { include: { ingredients: { include: { ingredient: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Custo de produção calculado a partir do custo médio atual dos insumos.
            </p>
          </div>
          <Link href="/receitas/nova" className={buttonVariants()}>
            Novo produto
          </Link>
        </div>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Rende</TableHead>
                  <TableHead className="text-right">Custo do lote</TableHead>
                  <TableHead className="text-right">Custo / porção</TableHead>
                  <TableHead className="text-right">Preço venda</TableHead>
                  <TableHead className="text-right">Preço/cento</TableHead>
                  <TableHead className="text-right">Preço sugerido</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((r) => {
                  const items = r.groups.flatMap((g) =>
                    g.ingredients.map((ri) => ({
                      qtyInBase: Number(ri.qtyInBase),
                      avgCost: Number(ri.ingredient.avgCost),
                    }))
                  );
                  const custoLote = sumIngredientCost(items);
                  const custoPorcao = custoLote / Number(r.yieldQty);
                  const unitPrice = Number(r.unitPrice);
                  const margem =
                    unitPrice > 0 && Number(r.yieldQty) > 0
                      ? computeMargin({
                          ingredientCostBatch: custoLote,
                          yieldQty: Number(r.yieldQty),
                          unitPrice,
                          packagingCost: Number(r.packagingCost),
                          fixedCostPct: Number(r.fixedCostPct),
                          targetMarginPct: Number(r.targetMarginPct),
                        })
                      : null;

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.category.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(r.yieldQty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(custoLote, 2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(custoPorcao, 2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(unitPrice, 2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatBRL(unitPrice * 100, 2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {margem?.belowTarget ? (
                          <span className="font-medium text-destructive">
                            {formatBRL(margem.suggestedPrice, 2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/receitas/${r.id}/editar`}
                          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Editar
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {recipes.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum produto ainda. Clique em &ldquo;Novo produto&rdquo;.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
