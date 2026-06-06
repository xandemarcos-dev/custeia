import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { createEntryAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export default async function NovaEntradaPage() {
  const [ingredients, units] = await Promise.all([
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Nova compra</CardTitle>
            <p className="text-sm text-muted-foreground">
              Registre uma entrada de insumo. O custo médio é recalculado automaticamente.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createEntryAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ingredientId">Insumo</Label>
                <select id="ingredientId" name="ingredientId" required className={selectCls}>
                  <option value="">Selecione…</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purchaseUnitId">Unidade de compra</Label>
                <select id="purchaseUnitId" name="purchaseUnitId" required className={selectCls}>
                  <option value="">Selecione…</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="purchaseQty">Quantidade</Label>
                  <Input id="purchaseQty" name="purchaseQty" type="number" step="any" min="0" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unitPrice">Preço por unidade (R$)</Label>
                  <Input id="unitPrice" name="unitPrice" type="number" step="any" min="0" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="freightTotal">Frete total (R$)</Label>
                <Input id="freightTotal" name="freightTotal" type="number" step="any" min="0" defaultValue="0" />
              </div>

              <Button type="submit" className="w-full">Registrar compra</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
