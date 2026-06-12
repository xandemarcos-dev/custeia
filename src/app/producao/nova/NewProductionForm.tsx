"use client";

import { useActionState, useMemo, useState } from "react";
import { createProductionAction, type NewProductionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RecipeItem = {
  name: string;
  baseUnit: string;
  qtyPerBatch: number;
  stockQty: number;
  avgCost: number;
};
type RecipeOpt = {
  id: string;
  name: string;
  yieldQty: number;
  items: RecipeItem[];
};

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const fmtQty = (v: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(v);

export function NewProductionForm({ recipes }: { recipes: RecipeOpt[] }) {
  const [state, action, pending] = useActionState<NewProductionState, FormData>(createProductionAction, {});
  const [recipeId, setRecipeId] = useState("");
  const [batchStr, setBatchStr] = useState("1");

  const recipe = recipes.find((r) => r.id === recipeId);
  const batchCount = Number(batchStr);

  const preview = useMemo(() => {
    if (!recipe || !(batchCount > 0)) return null;
    let totalCost = 0;
    const rows = recipe.items.map((it) => {
      const needed = it.qtyPerBatch * batchCount;
      const after = it.stockQty - needed;
      totalCost += needed * it.avgCost;
      return { ...it, needed, after, short: after < 0 };
    });
    return {
      rows,
      totalCost,
      totalPortions: recipe.yieldQty * batchCount,
      hasShortage: rows.some((r) => r.short),
    };
  }, [recipe, batchCount]);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="recipeId">Receita produzida</Label>
        <select
          id="recipeId"
          name="recipeId"
          required
          className={selectCls}
          value={recipeId}
          onChange={(e) => setRecipeId(e.target.value)}
        >
          <option value="">Selecione…</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="batchCount">Quantos lotes</Label>
          <Input
            id="batchCount"
            name="batchCount"
            type="number"
            step="any"
            min="0"
            required
            value={batchStr}
            onChange={(e) => setBatchStr(e.target.value)}
          />
        </div>
        {recipe && batchCount > 0 && (
          <div className="space-y-1.5">
            <Label>Rendimento</Label>
            <p className="pt-2 text-sm">
              <span className="font-medium">{fmtQty(recipe.yieldQty * batchCount)}</span>{" "}
              <span className="text-muted-foreground">porções</span>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Observação (opcional)</Label>
        <Input id="notes" name="notes" placeholder="Ex: encomenda da Maria" />
      </div>

      {preview && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Consumo de estoque</p>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Insumo</th>
                  <th className="px-3 py-2 text-right">Precisa</th>
                  <th className="px-3 py-2 text-right">Tem</th>
                  <th className="px-3 py-2 text-right">Sobra</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.name} className="border-t">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtQty(r.needed)} {r.baseUnit}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {fmtQty(r.stockQty)} {r.baseUnit}
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums ${r.short ? "font-medium text-destructive" : ""}`}>
                      {fmtQty(r.after)} {r.baseUnit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Custo total do lote: </span>
            <span className="font-semibold">{brl(preview.totalCost)}</span>
          </div>
          {preview.hasShortage && (
            <p className="text-xs text-destructive">
              Algum insumo não tem estoque suficiente. Registre as compras antes de salvar.
            </p>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={pending || (preview?.hasShortage ?? false)}>
        {pending ? "Registrando…" : "Registrar produção"}
      </Button>
    </form>
  );
}
