"use client";

import { useActionState } from "react";
import { updateRecipeAction, type EditRecipeState } from "./actions";
import { IngredientGroups } from "@/components/IngredientGroups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = { id: string; name: string };
type Ingredient = { id: string; name: string; baseUnit: string };
type Recipe = {
  id: string;
  name: string;
  categoryId: string;
  yieldQty: number;
  unitPrice: number;
  targetMarginPct: number;
  packagingCost: number;
  fixedCostPct: number;
  monthlySalesQty: number | null;
  groups: { name: string; items: { ingredientId: string; qtyInBase: number }[] }[];
};

const selectCls =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export function EditRecipeForm({
  recipe,
  categories,
  ingredients,
}: {
  recipe: Recipe;
  categories: Category[];
  ingredients: Ingredient[];
}) {
  const [state, action, pending] = useActionState<EditRecipeState, FormData>(updateRecipeAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={recipe.id} />
      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nome do produto</Label>
        <Input id="name" name="name" required defaultValue={recipe.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Categoria</Label>
        <select id="categoryId" name="categoryId" required defaultValue={recipe.categoryId} className={selectCls}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="yieldQty">Rende (porções)</Label>
          <Input id="yieldQty" name="yieldQty" type="number" step="any" min="0" required defaultValue={recipe.yieldQty} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unitPrice">Preço de venda (R$)</Label>
          <Input id="unitPrice" name="unitPrice" type="number" step="any" min="0" required defaultValue={recipe.unitPrice} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monthlySalesQty">Venda/mês (un)</Label>
          <Input
            id="monthlySalesQty"
            name="monthlySalesQty"
            type="number"
            step="any"
            min="0"
            placeholder="Opcional"
            defaultValue={recipe.monthlySalesQty ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="targetMarginPct">Margem alvo (%)</Label>
          <Input id="targetMarginPct" name="targetMarginPct" type="number" step="any" min="0" max="99" defaultValue={recipe.targetMarginPct} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="packagingCost">Embalagem/lote (R$)</Label>
          <Input id="packagingCost" name="packagingCost" type="number" step="any" min="0" defaultValue={recipe.packagingCost} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fixedCostPct">Custos fixos (%)</Label>
          <Input id="fixedCostPct" name="fixedCostPct" type="number" step="any" min="0" defaultValue={recipe.fixedCostPct} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Ficha técnica</Label>
        <p className="text-xs text-muted-foreground">
          Separe em grupos quando a receita tiver partes distintas (ex.: massa e cobertura).
        </p>
        <IngredientGroups ingredients={ingredients} initialGroups={recipe.groups} />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
