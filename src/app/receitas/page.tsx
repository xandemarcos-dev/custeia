import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";
import { sumIngredientCost } from "@/services/recipeCost";
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
  const recipes = await prisma.recipe.findMany({
    where: { isActive: true },
    include: {
      category: true,
      groups: { include: { ingredients: { include: { ingredient: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
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
                        {formatBRL(Number(r.unitPrice), 2)}
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
