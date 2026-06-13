import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { formatBRL } from "@/lib/format";
import { sumIngredientCost } from "@/services/recipeCost";
import { computeMargin } from "@/services/margin";
import { computePriceIncreases, type EntryForAlert } from "@/services/priceAlerts";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingCart,
  Factory,
  PlusCircle,
  Calculator,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Package,
  Layers,
  Wallet,
  TrendingUp,
} from "lucide-react";

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
      Icon: AlertTriangle,
    },
    {
      label: "Insumos para repor",
      value: paraRepor,
      href: "/reposicao",
      alert: paraRepor > 0,
      Icon: RefreshCw,
    },
    { label: "Produtos", value: recipes.length, href: "/receitas", alert: false, Icon: Package },
    {
      label: "Insumos",
      value: ingredients.length,
      href: "/ingredientes",
      alert: false,
      Icon: Layers,
    },
  ];

  const acoes = [
    { label: "Nova compra", href: "/entradas/nova", Icon: ShoppingCart },
    { label: "Registrar produção", href: "/producao/nova", Icon: Factory },
    { label: "Novo produto", href: "/receitas/nova", Icon: PlusCircle },
    { label: "Simular compra", href: "/simulador", Icon: Calculator },
  ];

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#16202b] sm:text-3xl">
            Visão geral
          </h1>
          <p className="mt-1.5 text-[15px] font-medium text-muted-foreground">
            O retrato do negócio agora — custos e margens pelo custo médio atual.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {kpis.map(({ label, value, href, alert, Icon }) => (
            <Link key={label} href={href}>
              <Card className="relative h-full rounded-2xl transition-all hover:bg-muted/40 hover:ring-foreground/20 active:translate-y-px">
                <CardContent className="pt-1">
                  <span
                    className={`absolute right-4 top-4 grid size-8 place-items-center rounded-lg ${
                      alert
                        ? "bg-[#fdecee] text-[#d23c47]"
                        : Icon === RefreshCw
                          ? "bg-[#e6faf6] text-[#0f9b8e]"
                          : "bg-[#eef1f4] text-[#5b6675]"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <p
                    className={`text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl ${
                      alert ? "text-[#d23c47]" : "text-[#16202b]"
                    }`}
                  >
                    {value}
                  </p>
                  <p className="mt-2 text-[13px] font-medium leading-snug text-muted-foreground">
                    {label}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {acoes.map(({ label, href, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3.5 rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-[#e8ebef] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(16,24,40,0.08)] hover:ring-[#9fe6da] active:translate-y-0"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e6faf6] text-[#0f9b8e]">
                <Icon className="size-[19px]" />
              </span>
              <span className="text-sm font-semibold leading-tight text-[#1c2733]">{label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="relative rounded-2xl border-0 bg-gradient-to-br from-white to-[#f2fbf9] ring-1 ring-[#d9efe9]">
            <CardContent className="pt-1">
              <span className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#d6f4ee] text-[#0f9b8e]">
                <Wallet className="size-[18px]" />
              </span>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[#5a7a73]">
                Capital parado em estoque
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums text-[#16202b] sm:text-4xl">
                {formatBRL(capitalEstoque, 2)}
              </p>
              <p className="mt-2 text-[13px] font-medium text-muted-foreground">
                Soma do estoque atual pelo custo médio de cada insumo.
              </p>
            </CardContent>
          </Card>

          {priceAlerts.length > 0 && (
            <Card className="relative rounded-2xl ring-1 ring-[#f3d9dc]">
              <CardContent className="pt-1">
                <span className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#fdecee] text-[#d23c47]">
                  <TrendingUp className="size-[18px]" />
                </span>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8a5a5e]">
                  Insumos que subiram de preço
                </p>
                <ul className="mt-3 space-y-2">
                  {priceAlerts.slice(0, 3).map((a) => (
                    <li
                      key={a.ingredientId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate font-semibold text-[#1c2733]">{a.name}</span>
                      <span className="shrink-0 rounded-full bg-[#fdecee] px-2.5 py-0.5 text-xs font-bold text-[#c8323c] tabular-nums">
                        +{a.pctIncrease.toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
                {priceAlerts.length > 3 && (
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    e mais {priceAlerts.length - 3} na última compra.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {abaixoDaMeta.length > 0 && (
          <Card className="mt-4 rounded-2xl">
            <CardContent className="pt-2">
              <h2 className="text-[17px] font-bold tracking-tight text-[#16202b]">
                Atenção primeiro
              </h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Os produtos com margem mais distante da meta.
              </p>
              <ul className="mt-3">
                {abaixoDaMeta.slice(0, 5).map((m, i, arr) => {
                  const severity =
                    m.marginPct < 0
                      ? "bg-[#fdecee] text-[#c8323c]"
                      : m.marginGap <= 5
                        ? "bg-[#e7f6ee] text-[#1f9d6b]"
                        : "bg-[#fbf2e3] text-[#b3741a]";
                  return (
                    <li
                      key={m.id}
                      className={`-mx-3 rounded-xl transition-colors hover:bg-[#f8fafb] ${
                        i < arr.length - 1 ? "border-b border-[#eef1f3]" : ""
                      }`}
                    >
                      <Link
                        href={`/receitas/${m.id}/editar`}
                        className="flex items-center justify-between gap-3 px-3 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-[#1c2733]">
                            {m.name}
                          </p>
                          <p className="mt-1 text-[13px] font-medium text-[#7a8490] tabular-nums">
                            vende a{" "}
                            <span className="font-bold text-[#2a3540]">
                              {formatBRL(m.unitPrice, 2)}
                            </span>{" "}
                            · sugerido{" "}
                            <span className="font-bold text-[#0f9b8e]">
                              {formatBRL(m.suggestedPrice, 2)}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${severity}`}
                        >
                          {m.marginPct.toFixed(1)}%
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {abaixoDaMeta.length > 5 && (
                <p className="mt-4 text-sm">
                  <Link
                    href="/margem"
                    className="group inline-flex items-center gap-1.5 font-bold text-[#0f9b8e] hover:gap-2.5 [transition:gap_.15s]"
                  >
                    Ver todos os {abaixoDaMeta.length} no Painel de Margem
                    <ArrowRight className="size-4" />
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
