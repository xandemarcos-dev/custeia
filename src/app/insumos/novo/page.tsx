import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { createIngredientAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NovoInsumoPage() {
  const [categories, units] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);

  const labelCls = "block text-sm font-medium mb-1";
  const fieldCls =
    "w-full rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm";

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Novo insumo</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Cadastre um insumo. O custo médio aparece depois da primeira compra.
        </p>

        <form action={createIngredientAction} className="mt-6 space-y-4">
          <div>
            <label className={labelCls} htmlFor="name">Nome</label>
            <input id="name" name="name" required className={fieldCls} placeholder="Ex: Manteiga" />
          </div>

          <div>
            <label className={labelCls} htmlFor="brand">Marca (opcional)</label>
            <input id="brand" name="brand" className={fieldCls} placeholder="Ex: Aviação" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="categoryId">Categoria</label>
              <select id="categoryId" name="categoryId" required className={fieldCls}>
                <option value="">Selecione…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="baseUnitId">Unidade base</label>
              <select id="baseUnitId" name="baseUnitId" required className={fieldCls}>
                <option value="">Selecione…</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="minStockQty">Estoque mínimo (opcional)</label>
            <input id="minStockQty" name="minStockQty" type="number" step="any" min="0" defaultValue="0" className={fieldCls} />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Cadastrar insumo
          </button>
        </form>
      </main>
    </>
  );
}
