import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { createIngredientAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export default async function NovoInsumoPage() {
  const [categories, units] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Novo insumo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Cadastre um insumo. O custo médio aparece depois da primeira compra.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createIngredientAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" required placeholder="Ex: Manteiga" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brand">Marca (opcional)</Label>
                <Input id="brand" name="brand" placeholder="Ex: Aviação" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="categoryId">Categoria</Label>
                  <select id="categoryId" name="categoryId" required className={selectCls}>
                    <option value="">Selecione…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="baseUnitId">Unidade base</Label>
                  <select id="baseUnitId" name="baseUnitId" required className={selectCls}>
                    <option value="">Selecione…</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minStockQty">Estoque mínimo (opcional)</Label>
                <Input id="minStockQty" name="minStockQty" type="number" step="any" min="0" defaultValue="0" />
              </div>

              <Button type="submit" className="w-full">Cadastrar insumo</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
