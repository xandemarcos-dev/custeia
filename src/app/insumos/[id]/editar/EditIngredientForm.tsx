"use client";

import { useActionState } from "react";
import { updateIngredientAction, type EditState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string };
type Ingredient = {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  baseUnitId: string;
  minStockQty: number;
};

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function EditIngredientForm({
  ingredient,
  categories,
  units,
}: {
  ingredient: Ingredient;
  categories: Option[];
  units: Option[];
}) {
  const [state, action, pending] = useActionState<EditState, FormData>(
    updateIngredientAction,
    {}
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={ingredient.id} />
      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required defaultValue={ingredient.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brand">Marca (opcional)</Label>
        <Input id="brand" name="brand" defaultValue={ingredient.brand} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Categoria</Label>
          <select id="categoryId" name="categoryId" required defaultValue={ingredient.categoryId} className={selectCls}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="baseUnitId">Unidade base</Label>
          <select id="baseUnitId" name="baseUnitId" required defaultValue={ingredient.baseUnitId} className={selectCls}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="minStockQty">Estoque mínimo</Label>
        <Input id="minStockQty" name="minStockQty" type="number" step="any" min="0" defaultValue={ingredient.minStockQty} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
