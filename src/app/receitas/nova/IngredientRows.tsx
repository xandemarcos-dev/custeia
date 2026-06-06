"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Option = { id: string; name: string };

const selectCls =
  "flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function IngredientRows({ ingredients }: { ingredients: Option[] }) {
  const [rows, setRows] = useState<number[]>([0]);

  function addRow() {
    setRows((r) => [...r, Date.now()]);
  }
  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x !== id) : r));
  }

  return (
    <div className="space-y-2">
      {rows.map((id) => (
        <div key={id} className="flex items-center gap-2">
          <select name="ingredientId" required className={selectCls}>
            <option value="">Insumo…</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </select>
          <Input
            name="qtyInBase"
            type="number"
            step="any"
            min="0"
            required
            placeholder="qtd (un. base)"
            className="w-40"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRow(id)}
            aria-label="Remover insumo"
          >
            ✕
          </Button>
        </div>
      ))}
      <Button type="button" variant="link" size="sm" onClick={addRow} className="px-0">
        + adicionar insumo
      </Button>
    </div>
  );
}
