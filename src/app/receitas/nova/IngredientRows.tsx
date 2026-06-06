"use client";

import { useState } from "react";

type Option = { id: string; name: string };

export function IngredientRows({ ingredients }: { ingredients: Option[] }) {
  // Cada número é uma "linha". Começamos com uma.
  const [rows, setRows] = useState<number[]>([0]);

  const fieldCls =
    "rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm";

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
          <select name="ingredientId" required className={`${fieldCls} flex-1`}>
            <option value="">Insumo…</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </select>
          <input
            name="qtyInBase"
            type="number"
            step="any"
            min="0"
            required
            placeholder="qtd (un. base)"
            className={`${fieldCls} w-40`}
          />
          <button
            type="button"
            onClick={() => removeRow(id)}
            className="rounded-lg px-3 py-2 text-sm text-black/50 hover:bg-black/[.04] dark:text-white/50 dark:hover:bg-white/[.06]"
            aria-label="Remover insumo"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm font-medium text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white"
      >
        + adicionar insumo
      </button>
    </div>
  );
}
