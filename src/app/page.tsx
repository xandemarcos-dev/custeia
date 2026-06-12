import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { formatBRL } from "@/lib/format";
import { sumIngredientCost } from "@/services/recipeCost";
import { computeMargin } from "@/services/margin";
import { computePriceIncreases, type EntryForAlert } from "@/services/priceAlerts";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function Home() {
  const workspaceId = await requireWorkspaceId();

  const [recipes, ingredients, entries] = await Promise.all([
    prisma.recipe.findMany({
      where: { isActive: true, workspaceId },
      include: { groups: { include: { ingredients: { include: { ingredient: true } } } } },
    }),
    prisma.ingredient.findMany({
      where: { workspaceId },
      select: { stockQty: true, minStockQty: true, avgCost: true },
    }),
    prisma.ingredientEntry.findMany({
      where: { workspaceId },
      select: {
        ingredientId: true,
        entryDate: true,
        totalCost: true,
        qtyInBase: true,
        ingredient: { select: { name: true, baseUnit: { select: { baseUnit: true } } } },
      },
    }),
  ]);

  const margens = recipes
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
      return { id: r.id, name: r.name, unitPrice: Number(r.unitPrice), ...m };
    })
    .sort((a, b) => a.marginGap - b.marginGap);

  const abaixoDaMeta = margens.filter((m) => m.belowTarget);
  const paraRepor = ingredients.filter(
    (i) => Number(i.minStockQty) > 0 && Number(i.stockQty) < Number(i.minStockQty)
  ).length;

  const capitalEstoque = ingredients.reduce(
    (acc, i) => acc + Number(i.stockQty) * Number(i.avgCost),
    0
  );

  const entriesForAlert: EntryForAlert[] = entries.map((e) => ({
    ingredientId: e.ingredientId,
    ingredientName: e.ingredient.name,
    baseUnit: e.ingredient.baseUnit.baseUnit,
    entryDate: e.entryDate,
    totalCost: Number(e.totalCost),
    qtyInBase: Number(e.qtyInBase),
  }));
  const priceAlerts = computePriceIncreases(entriesForAlert);

  const kpis = [
    {
      label: "Produtos abaixo da meta",
      value: abaixoDaMeta.length,
      href: "/margem",
      alert: abaixoDaMeta.length > 0,
    },
    { label: "Insumos para repor", value: paraRepor, href: "/reposicao", alert: paraRepor > 0 },
    { label: "Produtos", value: recipes.length, href: "/receitas", alert: false },
    { label: "Insumos", value: ingredients.length, href: "/ingredientes", alert: false },
  ];

  const acoes = [
    { label: "Nova compra", href: "/entradas/nova" },
    { label: "Registrar produção", href: "/producao/nova" },
    { label: "Novo produto", href: "/receitas/nova" },
    { label: "Simular compra", href: "/simulador" },
  ];

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O retrato do negócio agora — custos e margens pelo custo médio atual.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href}>
              <Card className="transition-all hover:bg-muted/40 hover:ring-foreground/20 active:translate-y-px">
                <CardContent className="pt-4">
                  <p
                    className={`text-3xl font-semibold tabular-nums ${
                      k.alert ? "text-destructive" : ""
                    }`}
                  >
                    {k.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{k.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {acoes.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={buttonVariants({
                variant: "outline",
                className: "w-full sm:w-auto",
              })}
            >
              {a.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Capital parado em estoque</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {formatBRL(capitalEstoque, 2)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Soma do estoque atual pelo custo médio de cada insumo.
              </p>
            </CardContent>
          </Card>

          {priceAlerts.length > 0 && (
            <Card className="border-destructive/30">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Insumos que subiram de preço</p>
                <ul className="mt-2 space-y-1.5">
                  {priceAlerts.slice(0, 3).map((a) => (
                    <li
                      key={a.ingredientId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate font-medium">{a.name}</span>
                      <span className="shrink-0 font-medium text-destructive tabular-nums">
                        +{a.pctIncrease.toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
                {priceAlerts.length > 3 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    e mais {priceAlerts.length - 3} na última compra.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {abaixoDaMeta.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Atenção primeiro</CardTitle>
              <p className="text-sm text-muted-foreground">
                Os produtos com margem mais distante da meta.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {abaixoDaMeta.slice(0, 5).map((m) => (
                  <li key={m.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/receitas/${m.id}/editar`}
                        className="truncate font-medium hover:underline"
                      >
                        {m.name}
                      </Link>
                      <Badge variant="destructive" className="shrink-0">
                        {m.marginPct.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                      vende a {formatBRL(m.unitPrice, 2)} · sugerido{" "}
                      <span className="font-medium text-foreground">
                        {formatBRL(m.suggestedPrice, 2)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
              {abaixoDaMeta.length > 5 && (
                <p className="mt-3 text-sm">
                  <Link href="/margem" className="text-muted-foreground hover:underline">
                    Ver todos os {abaixoDaMeta.length} no Painel de Margem →
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
