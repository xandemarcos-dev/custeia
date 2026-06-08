"use client";

import { useMemo, useState } from "react";
import { createEntryAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dimension } from "@/lib/dimension";
import { dimensionLabel } from "@/lib/dimension";

type IngredientOpt = { id: string; name: string; dimension: Dimension };
type UnitOpt = { id: string; name: string; dimension: Dimension };

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function NewEntryForm({
  ingredients,
  units,
}: {
  ingredients: IngredientOpt[];
  units: UnitOpt[];
}) {
  const [ingredientId, setIngredientId] = useState("");

  const selectedIng = ingredients.find((i) => i.id === ingredientId);

  // Só unidades da MESMA dimensão do insumo (R6 — prevenção por design).
  const unitOptions = useMemo(() => {
    if (!selectedIng) return [];
    return units.filter((u) => u.dimension === selectedIng.dimension);
  }, [selectedIng, units]);

  return (
    <form action={createEntryAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ingredientId">Insumo</Label>
        <select
          id="ingredientId"
          name="ingredientId"
          required
          className={selectCls}
          value={ingredientId}
          onChange={(e) => setIngredientId(e.target.value)}
        >
          <option value="">Selecione…</option>
          {ingredients.map((ing) => (
            <option key={ing.id} value={ing.id}>{ing.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="purchaseUnitId">Unidade de compra</Label>
        <select
          id="purchaseUnitId"
          name="purchaseUnitId"
          required
          disabled={!selectedIng}
          className={`${selectCls} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <option value="">
            {selectedIng ? "Selecione…" : "Escolha o insumo primeiro"}
          </option>
          {unitOptions.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        {selectedIng && (
          <p className="text-xs text-muted-foreground">
            Mostrando apenas unidades de {dimensionLabel(selectedIng.dimension)} (compatíveis com este insumo).
          </p>
        )}
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
  );
}
