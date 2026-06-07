"use client";

import { useState } from "react";
import { createIngredientAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string };

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function NewIngredientForm({
  categories,
  units,
}: {
  categories: Option[];
  units: Option[];
}) {
  const [baseUnitId, setBaseUnitId] = useState("");
  const unitLabel = units.find((u) => u.id === baseUnitId)?.name ?? "";

  return (
    <form action={createIngredientAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required placeholder="Ex: Manteiga" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brand">Marca (opcional)</Label>
        <Input id="brand" name="brand" placeholder="Ex: Aviação" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Categoria</Label>
          <select id="categoryId" name="categoryId" required className={selectCls}>
            <option value="">Selecione…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="baseUnitId">Unidade base</Label>
          <select
            id="baseUnitId"
            name="baseUnitId"
            required
            value={baseUnitId}
            onChange={(e) => setBaseUnitId(e.target.value)}
            className={selectCls}
          >
            <option value="">Selecione…</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="minStockQty">Estoque mínimo (opcional)</Label>
        <div className="relative">
          <Input id="minStockQty" name="minStockQty" type="number" step="any" min="0" defaultValue="0" className="pr-12" />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            {unitLabel}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Na unidade base do insumo{unitLabel ? ` (${unitLabel})` : ""}. Ex: 10 kg = 10000 g.
        </p>
      </div>

      <Button type="submit" className="w-full">Cadastrar insumo</Button>
    </form>
  );
}
