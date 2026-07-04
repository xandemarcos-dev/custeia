"use client";

import { useActionState, useState } from "react";
import { createManualExitAction, type ManualExitState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IngredientOpt = { id: string; name: string; baseUnit: string; stockQty: number };

const selectCls =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const SOURCE_LABELS: Record<string, string> = {
  waste: "Perda / descarte",
  adjustment: "Ajuste de estoque",
  other: "Outro",
};

export function ManualExitForm({ ingredients }: { ingredients: IngredientOpt[] }) {
  const [state, action, pending] = useActionState<ManualExitState, FormData>(createManualExitAction, {});
  const [ingredientId, setIngredientId] = useState("");

  const selected = ingredients.find((i) => i.id === ingredientId);

  const todayLocal = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

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
        {selected && (
          <p className="text-xs text-muted-foreground">
            Estoque atual: {selected.stockQty.toLocaleString("pt-BR")} {selected.baseUnit}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="qtyInBase">
            Quantidade{selected ? ` (${selected.baseUnit})` : ""}
          </Label>
          <Input
            id="qtyInBase"
            name="qtyInBase"
            type="number"
            step="any"
            min="0"
            required
            placeholder="0"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="source">Motivo</Label>
          <select id="source" name="source" required className={selectCls}>
            {Object.entries(SOURCE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="exitDate">Data</Label>
          <Input
            id="exitDate"
            name="exitDate"
            type="date"
            required
            defaultValue={todayLocal}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Input
            id="notes"
            name="notes"
            type="text"
            placeholder="Ex: embalagem rasgada"
          />
        </div>
      </div>

      <Button type="submit" variant="destructive" className="w-full" disabled={pending}>
        {pending ? "Registrando…" : "Registrar saída"}
      </Button>
    </form>
  );
}
