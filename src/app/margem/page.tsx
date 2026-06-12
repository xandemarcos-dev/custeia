import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { formatBRL } from "@/lib/format";
import { sumIngredientCost } from "@/services/recipeCost";
import { computeMargin } from "@/services/margin";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function MargemPage() {
  const workspaceId = await requireWorkspaceId();
  const recipes = await prisma.recipe.findMany({
    where: { isActive: true, workspaceId },
    include: {
      category: true,
      groups: { include: { ingredients: { include: { ingredient: true } } } },
    },
  });

  const rows = recipes
    .map((r) => {
      const items = r.groups.flatMap((g) =>
        g.ingredients.map((ri) => ({
          qtyInBase: Number(ri.qtyInBase),
          avgCost: Number(ri.ingredient.avgCost),
        }))
      );
      const m = computeMargin({
        ingredientCostBatch: sumIngredientCost(items),
        yieldQty: Number(r.yieldQty),
        unitPrice: Number(r.unitPrice),
        packagingCost: Number(r.packagingCost),
        fixedCostPct: Number(r.fixedCostPct),
        targetMarginPct: Number(r.targetMarginPct),
      });
      return {
        id: r.id,
        name: r.name,
        unitPrice: Number(r.unitPrice),
        target: Number(r.targetMarginPct),
        ...m,
      };
    })
    .sort((a, b) => a.marginGap - b.marginGap);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Painel de Margem</CardTitle>
            <p className="text-sm text-muted-foreground">
              Margem real de cada produto vs a meta. Em vermelho, quem está abaixo.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Preço/un.</TableHead>
                  <TableHead className="text-right">Preço/cento</TableHead>
                  <TableHead className="text-right">Custo/un.</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-right">Preço sugerido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(r.unitPrice, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatBRL(r.unitPrice * 100, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(r.unitCost, 2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={r.belowTarget ? "destructive" : "default"}
                        className={r.belowTarget ? "" : "bg-green-600 text-white"}
                      >
                        {r.marginPct.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.target.toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.belowTarget ? (
                        <span className="font-medium text-red-600">
                          {formatBRL(r.suggestedPrice, 2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {rows.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum produto ainda. Cadastre um produto para ver a margem.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
