import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { createEntryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NovaEntradaPage() {
  const [ingredients, units] = await Promise.all([
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);

  const labelCls = "block text-sm font-medium mb-1";
  const fieldCls =
    "w-full rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm";

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Nova compra</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Registre uma entrada de insumo. O custo médio é recalculado automaticamente.
        </p>

        <form action={createEntryAction} className="mt-6 space-y-4">
          <div>
            <label className={labelCls} htmlFor="ingredientId">Insumo</label>
            <select id="ingredientId" name="ingredientId" required className={fieldCls}>
              <option value="">Selecione…</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>{ing.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="purchaseUnitId">Unidade de compra</label>
            <select id="purchaseUnitId" name="purchaseUnitId" required className={fieldCls}>
              <option value="">Selecione…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="purchaseQty">Quantidade</label>
              <input id="purchaseQty" name="purchaseQty" type="number" step="any" min="0" required className={fieldCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="unitPrice">Preço por unidade (R$)</label>
              <input id="unitPrice" name="unitPrice" type="number" step="any" min="0" required className={fieldCls} />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="freightTotal">Frete total (R$)</label>
            <input id="freightTotal" name="freightTotal" type="number" step="any" min="0" defaultValue="0" className={fieldCls} />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Registrar compra
          </button>
        </form>
      </main>
    </>
  );
}
