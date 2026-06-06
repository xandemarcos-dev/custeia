"use client";

import { useActionState } from "react";
import { createRecipeAction, type RecipeFormState } from "./actions";
import { IngredientRows } from "./IngredientRows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = { id: string; name: string };
type Ingredient = { id: string; name: string; baseUnit: string };

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function RecipeForm({
  categories,
  ingredients,
}: {
  categories: Category[];
  ingredients: Ingredient[];
}) {
  const [state, formAction, pending] = useActionState<RecipeFormState, FormData>(
    createRecipeAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

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
          <Input id="targetMarginPct" name="targetMarginPct" type="number" step="any" min="0" max="99" defaultValue="60" />
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

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando…" : "Cadastrar produto"}
      </Button>
    </form>
  );
}
