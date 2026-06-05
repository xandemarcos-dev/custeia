import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";
import { sumIngredientCost } from "@/services/recipeCost";
import { computeMargin } from "@/services/margin";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function MargemPage() {
  const recipes = await prisma.recipe.findMany({
    where: { isActive: true },
    include: {
      category: true,
      groups: { include: { ingredients: { include: { ingredient: true } } } },
    },
  });

  // Calcula custo + margem de cada produto.
  const rows = recipes.map((r) => {
    const items = r.groups.flatMap((g) =>
      g.ingredients.map((ri) => ({
        qtyInBase: Number(ri.qtyInBase),
        avgCost: Number(ri.ingredient.avgCost),
      }))
    );
    const ingredientCostBatch = sumIngredientCost(items);
    const m = computeMargin({
      ingredientCostBatch,
      yieldQty: Number(r.yieldQty),
      unitPrice: Number(r.unitPrice),
      packagingCost: Number(r.packagingCost),
      fixedCostPct: Number(r.fixedCostPct),
      targetMarginPct: Number(r.targetMarginPct),
    });
    return {
      id: r.id,
      name: r.name,
      category: r.category.name,
      unitPrice: Number(r.unitPrice),
      target: Number(r.targetMarginPct),
      ...m,
    };
  });

  // Piores primeiro (gap crescente).
  rows.sort((a, b) => a.marginGap - b.marginGap);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Painel de Margem</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Margem real de cada produto vs a meta. Em vermelho, quem está abaixo.
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] text-left dark:bg-white/[.03]">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium text-right">Preço</th>
                <th className="px-4 py-3 font-medium text-right">Custo/un.</th>
                <th className="px-4 py-3 font-medium text-right">Margem</th>
                <th className="px-4 py-3 font-medium text-right">Meta</th>
                <th className="px-4 py-3 font-medium text-right">Preço sugerido</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatBRL(r.unitPrice, 2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatBRL(r.unitCost, 2)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${r.belowTarget ? "text-red-600" : "text-green-600"}`}>
                    {r.marginPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-black/50 dark:text-white/50">
                    {r.target.toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.belowTarget ? (
                      <span className="font-medium text-red-600">{formatBRL(r.suggestedPrice, 2)}</span>
                    ) : (
                      <span className="text-black/40 dark:text-white/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <p className="px-4 py-8 text-center text-black/50 dark:text-white/50">
              Nenhum produto ainda. Rode os seeds de receitas (Passos 7.4 e 8.2).
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-black/50 dark:text-white/50">
          Custo por porção = insumos + embalagem + custos fixos. Preço sugerido = o que daria
          a margem alvo com o custo atual. Atualiza sozinho quando o custo dos insumos muda.
        </p>
      </main>
    </>
  );
}
