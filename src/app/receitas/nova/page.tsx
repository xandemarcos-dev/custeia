import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { createRecipeAction } from "./actions";
import { IngredientRows } from "./IngredientRows";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export default async function NovaReceitaPage() {
  const [categories, ingredients] = await Promise.all([
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Novo produto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Monte a ficha técnica. O custo e a margem são calculados automaticamente.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createRecipeAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome do produto</Label>
                <Input id="name" name="name" required placeholder="Ex: Beijinho" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="categoryId">Categoria</Label>
                <select id="categoryId" name="categoryId" required className={selectCls}>
                  <option value="">Selecione…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="yieldQty">Rende (porções)</Label>
                  <Input id="yieldQty" name="yieldQty" type="number" step="any" min="0" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unitPrice">Preço de venda (R$)</Label>
                  <Input id="unitPrice" name="unitPrice" type="number" step="any" min="0" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="targetMarginPct">Margem alvo (%)</Label>
                  <Input id="targetMarginPct" name="targetMarginPct" type="number" step="any" min="0" defaultValue="60" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="packagingCost">Embalagem/lote (R$)</Label>
                  <Input id="packagingCost" name="packagingCost" type="number" step="any" min="0" defaultValue="0" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fixedCostPct">Custos fixos (%)</Label>
                  <Input id="fixedCostPct" name="fixedCostPct" type="number" step="any" min="0" defaultValue="30" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Ingredientes</Label>
                <IngredientRows ingredients={ingredients} />
              </div>

              <Button type="submit" className="w-full">Cadastrar produto</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
