import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { formatBRL } from "@/lib/format";
import { sumIngredientCost } from "@/services/recipeCost";
import { computeMargin } from "@/services/margin";
import { marginSeverity, severityText } from "@/lib/severity";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
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

  const rows = recipes.map((r) => {
    const items = r.groups.flatMap((g) =>
      g.ingredients.map((ri) => ({
        qtyInBase: Number(ri.qtyInBase),
        avgCost: Number(ri.ingredient.avgCost),
      }))
    );
    const custoLote = sumIngredientCost(items);
    const unitPrice = Number(r.unitPrice);
    const yieldQty = Number(r.yieldQty);
    const custoPorcao = custoLote / yieldQty;
    const margem =
      unitPrice > 0 && yieldQty > 0
        ? computeMargin({
            ingredientCostBatch: custoLote,
            yieldQty,
            unitPrice,
            packagingCost: Number(r.packagingCost),
            fixedCostPct: Number(r.fixedCostPct),
            targetMarginPct: Number(r.targetMarginPct),
          })
        : null;
    return {
      id: r.id,
      name: r.name,
      category: r.category.name,
      yieldQty,
      custoLote,
      custoPorcao,
      unitPrice,
      margem,
    };
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Produtos"
          description="Custo de produção calculado a partir do custo médio atual dos insumos."
          actions={
            <Link href="/receitas/nova" className={buttonVariants()}>
              Novo produto
            </Link>
          }
        />

        <Card className="hidden md:block">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
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
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.yieldQty}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(r.custoLote, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(r.custoPorcao, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(r.unitPrice, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatBRL(r.unitPrice * 100, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.margem?.belowTarget ? (
                        <span
                          className={`font-bold ${severityText[marginSeverity(r.margem.marginPct, r.margem.marginGap)]}`}
                        >
                          {formatBRL(r.margem.suggestedPrice, 2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/receitas/${r.id}/editar`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Editar
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile: cada produto como card empilhado */}
        <div className="space-y-2.5 md:hidden">
          {rows.map((r) => (
            <Link
              key={r.id}
              href={`/receitas/${r.id}/editar`}
              className="block rounded-2xl bg-card p-4 ring-1 ring-[#e8ebef]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#16202b]">{r.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                    rende {r.yieldQty}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold tabular-nums text-[#16202b]">
                    {formatBRL(r.unitPrice, 2)}
                  </p>
                  <p className="text-xs text-muted-foreground">preço de venda</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eef1f3] pt-2.5 text-[13px]">
                <span className="text-muted-foreground tabular-nums">
                  custo/porção {formatBRL(r.custoPorcao, 2)}
                </span>
                {r.margem?.belowTarget ? (
                  <span className="tabular-nums">
                    <span className="text-muted-foreground">sugerido </span>
                    <span
                      className={`font-bold ${severityText[marginSeverity(r.margem.marginPct, r.margem.marginGap)]}`}
                    >
                      {formatBRL(r.margem.suggestedPrice, 2)}
                    </span>
                  </span>
                ) : (
                  <span className="font-medium text-[#1f9d6b]">na meta</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {rows.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            Nenhum produto ainda. Clique em &ldquo;Novo produto&rdquo;.
          </p>
        )}
      </main>
    </>
  );
}
