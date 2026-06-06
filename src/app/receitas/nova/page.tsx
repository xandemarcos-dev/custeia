import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { createRecipeAction } from "./actions";
import { IngredientRows } from "./IngredientRows";

export const dynamic = "force-dynamic";

export default async function NovaReceitaPage() {
  const [categories, ingredients] = await Promise.all([
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
  ]);

  const labelCls = "block text-sm font-medium mb-1";
  const fieldCls =
    "w-full rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm";

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Novo produto</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Monte a ficha técnica. O custo e a margem são calculados automaticamente.
        </p>

        <form action={createRecipeAction} className="mt-6 space-y-4">
          <div>
            <label className={labelCls} htmlFor="name">Nome do produto</label>
            <input id="name" name="name" required className={fieldCls} placeholder="Ex: Beijinho" />
          </div>

          <div>
            <label className={labelCls} htmlFor="categoryId">Categoria</label>
            <select id="categoryId" name="categoryId" required className={fieldCls}>
              <option value="">Selecione…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="yieldQty">Rende (porções)</label>
              <input id="yieldQty" name="yieldQty" type="number" step="any" min="0" required className={fieldCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="unitPrice">Preço de venda (R$)</label>
              <input id="unitPrice" name="unitPrice" type="number" step="any" min="0" required className={fieldCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls} htmlFor="targetMarginPct">Margem alvo (%)</label>
              <input id="targetMarginPct" name="targetMarginPct" type="number" step="any" min="0" defaultValue="60" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="packagingCost">Embalagem/lote (R$)</label>
              <input id="packagingCost" name="packagingCost" type="number" step="any" min="0" defaultValue="0" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="fixedCostPct">Custos fixos (%)</label>
              <input id="fixedCostPct" name="fixedCostPct" type="number" step="any" min="0" defaultValue="30" className={fieldCls} />
            </div>
          </div>

          <div>
            <span className={labelCls}>Ingredientes</span>
            <IngredientRows ingredients={ingredients} />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Cadastrar produto
          </button>
        </form>
      </main>
    </>
  );
}
