"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Option = { id: string; name: string; baseUnit: string };
type InitialItem = { ingredientId: string; qtyInBase: number };

const selectCls =
  "flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function IngredientRows({
  ingredients,
  initialItems,
}: {
  ingredients: Option[];
  initialItems?: InitialItem[];
}) {
  const seed =
    initialItems && initialItems.length > 0
      ? initialItems.map((it, i) => ({ key: i, ingredientId: it.ingredientId, qty: it.qtyInBase as number | undefined }))
      : [{ key: 0, ingredientId: "", qty: undefined as number | undefined }];

  const [rows, setRows] = useState(seed);
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  function addRow() {
    setRows((r) => [...r, { key: Date.now(), ingredientId: "", qty: undefined }]);
  }
  function removeRow(key: number) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));
  }
  function setIngredient(key: number, id: string) {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ingredientId: id } : x)));
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const unit = byId.get(row.ingredientId)?.baseUnit;
        return (
          <div key={row.key} className="flex items-center gap-2">
            <select
              name="ingredientId"
              required
              value={row.ingredientId}
              onChange={(e) => setIngredient(row.key, e.target.value)}
              className={selectCls}
            >
              <option value="">Insumo…</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>{ing.name}</option>
              ))}
            </select>
            <div className="relative w-44">
              <Input
                name="qtyInBase"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={row.qty}
                placeholder="quantidade"
                className="pr-12"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                {unit ?? ""}
              </span>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.key)} aria-label="Remover insumo">
              ✕
            </Button>
          </div>
        );
      })}
      <Button type="button" variant="link" size="sm" onClick={addRow} className="px-0">
        + adicionar insumo
      </Button>
    </div>
  );
}
