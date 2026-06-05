import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";
import { Header } from "@/components/Header";

// Renderiza a cada requisição (os dados mudam), não no build.
export const dynamic = "force-dynamic";

export default async function IngredientesPage() {
  const ingredients = await prisma.ingredient.findMany({
    include: { category: true, baseUnit: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ingredientes</h1>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              Custo médio ponderado móvel de cada insumo.
            </p>
          </div>
          <Link
            href="/entradas/nova"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Nova compra
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] text-left dark:bg-white/[.03]">
              <tr>
                <th className="px-4 py-3 font-medium">Insumo</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium text-right">Estoque</th>
                <th className="px-4 py-3 font-medium text-right">Custo médio</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={ing.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3">
                    {ing.name}
                    {ing.brand && (
                      <span className="ml-2 text-black/40 dark:text-white/40">{ing.brand}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{ing.category.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {Number(ing.stockQty).toLocaleString("pt-BR")} {ing.baseUnit.baseUnit}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatBRL(Number(ing.avgCost))}
                    <span className="text-black/40 dark:text-white/40"> /{ing.baseUnit.baseUnit}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {ingredients.length === 0 && (
            <p className="px-4 py-8 text-center text-black/50 dark:text-white/50">
              Nenhum ingrediente ainda. Rode o seed (Passo 5.2).
            </p>
          )}
        </div>
      </main>
    </>
  );
}
