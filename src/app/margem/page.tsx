import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { formatBRL } from "@/lib/format";
import { sumIngredientCost } from "@/services/recipeCost";
import { computeMargin } from "@/services/margin";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { marginSeverity, severityBadge, severityText } from "@/lib/severity";

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
      const monthlyQty =
        r.monthlySalesQty == null ? null : Number(r.monthlySalesQty);
      const monthlyGain =
        m.belowTarget && monthlyQty != null
          ? (m.suggestedPrice - Number(r.unitPrice)) * monthlyQty
          : null;
      return {
        id: r.id,
        name: r.name,
        unitPrice: Number(r.unitPrice),
        target: Number(r.targetMarginPct),
        monthlyQty,
        monthlyGain,
        ...m,
      };
    })
    .sort((a, b) => a.marginGap - b.marginGap);

  const ganhoTotalMes = rows.reduce((acc, r) => acc + (r.monthlyGain ?? 0), 0);
  const produtosComGanho = rows.filter((r) => (r.monthlyGain ?? 0) > 0).length;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Margem"
          description="Margem real de cada produto vs a meta. Em vermelho, quem está abaixo."
        />
        {ganhoTotalMes > 0 && (
          <Card className="mb-4 border-l-[3px] border-l-[#2bc4b0]">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                Ajustando os {produtosComGanho} produto{produtosComGanho > 1 ? "s" : ""} abaixo da
                meta (com volume informado) para o preço sugerido
              </p>
              <p className="mt-1 text-2xl font-semibold sm:text-3xl">
                você ganharia{" "}
                <span className="text-emerald-600">≈ {formatBRL(ganhoTotalMes, 2)}</span>{" "}
                <span className="text-base font-normal text-muted-foreground">por mês</span>
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="hidden md:block">
          <CardContent>
            <Table>
              <TableHeader className="[&_th]:border-b">
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Preço/un.</TableHead>
                  <TableHead className="text-right">Preço/cento</TableHead>
                  <TableHead className="text-right">Custo/un.</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-right">Vol./mês</TableHead>
                  <TableHead className="text-right">Preço sugerido</TableHead>
                  <TableHead className="text-right">Ganho/mês</TableHead>
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
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                          severityBadge[marginSeverity(r.marginPct, r.marginGap)]
                        }`}
                      >
                        {r.marginPct.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.target.toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.monthlyQty != null ? (
                        r.monthlyQty.toLocaleString("pt-BR")
                      ) : (
                        <Link
                          href={`/receitas/${r.id}/editar`}
                          className="text-muted-foreground hover:text-foreground hover:underline"
                        >
                          definir
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.belowTarget ? (
                        <span
                          className={`font-bold ${severityText[marginSeverity(r.marginPct, r.marginGap)]}`}
                        >
                          {formatBRL(r.suggestedPrice, 2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.monthlyGain != null && r.monthlyGain > 0 ? (
                        <span className="font-medium text-emerald-600">
                          +{formatBRL(r.monthlyGain, 2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
            <div key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-[#e8ebef]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#16202b]">{r.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                    meta {r.target.toFixed(0)}%
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                    severityBadge[marginSeverity(r.marginPct, r.marginGap)]
                  }`}
                >
                  {r.marginPct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-[#eef1f3] pt-2.5 text-[13px]">
                <span className="text-muted-foreground">Preço/un.</span>
                <span className="text-right font-medium tabular-nums">
                  {formatBRL(r.unitPrice, 2)}
                </span>
                <span className="text-muted-foreground">Custo/un.</span>
                <span className="text-right font-medium tabular-nums">
                  {formatBRL(r.unitCost, 2)}
                </span>
                <span className="text-muted-foreground">Vol./mês</span>
                <span className="text-right font-medium tabular-nums">
                  {r.monthlyQty != null ? (
                    r.monthlyQty.toLocaleString("pt-BR")
                  ) : (
                    <Link
                      href={`/receitas/${r.id}/editar`}
                      className="font-medium text-primary hover:underline"
                    >
                      definir
                    </Link>
                  )}
                </span>
                {r.belowTarget && (
                  <>
                    <span className="text-muted-foreground">Sugerido</span>
                    <span
                      className={`text-right font-bold tabular-nums ${severityText[marginSeverity(r.marginPct, r.marginGap)]}`}
                    >
                      {formatBRL(r.suggestedPrice, 2)}
                    </span>
                  </>
                )}
                {r.monthlyGain != null && r.monthlyGain > 0 && (
                  <>
                    <span className="text-muted-foreground">Ganho/mês</span>
                    <span className="text-right font-bold tabular-nums text-emerald-600">
                      +{formatBRL(r.monthlyGain, 2)}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {rows.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            Nenhum produto ainda. Cadastre um produto para ver a margem.
          </p>
        )}
      </main>
    </>
  );
}
