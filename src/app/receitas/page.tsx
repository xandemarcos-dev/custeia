import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";
import { sumIngredientCost } from "@/services/recipeCost";
import { Header } from "@/components/Header";

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
        <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Custo de produção calculado a partir do custo médio atual dos insumos.
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] text-left dark:bg-white/[.03]">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium text-right">Rende</th>
                <th className="px-4 py-3 font-medium text-right">Custo do lote</th>
                <th className="px-4 py-3 font-medium text-right">Custo / porção</th>
                <th className="px-4 py-3 font-medium text-right">Preço venda</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => {
                // Achata todos os ingredientes de todos os grupos.
                const items = r.groups.flatMap((g) =>
                  g.ingredients.map((ri) => ({
                    qtyInBase: Number(ri.qtyInBase),
                    avgCost: Number(ri.ingredient.avgCost),
                  }))
                );
                const custoLote = sumIngredientCost(items);
                const custoPorcao = custoLote / Number(r.yieldQty);

                return (
                  <tr key={r.id} className="border-t border-black/5 dark:border-white/5">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{r.category.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(r.yieldQty)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatBRL(custoLote, 2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatBRL(custoPorcao, 2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatBRL(Number(r.unitPrice), 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {recipes.length === 0 && (
            <p className="px-4 py-8 text-center text-black/50 dark:text-white/50">
              Nenhum produto ainda. Rode o seed de receitas (Passo 7.4).
            </p>
          )}
        </div>
      </main>
    </>
  );
}
