"use client";

import { useActionState, useMemo, useState } from "react";
import { createEntryAction, type NewEntryState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dimension } from "@/lib/dimension";
import { dimensionLabel } from "@/lib/dimension";

type IngredientOpt = { id: string; name: string; dimension: Dimension };
type SupplierOpt = string; // só o nome — cria automaticamente se for novo
type UnitOpt = {
  id: string;
  name: string;
  dimension: Dimension;
  baseUnit: string;
  toBaseFactor: number;
};

const selectCls =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm disabled:cursor-not-allowed disabled:opacity-60";

const brl = (v: number, d = 4) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: d,
  }).format(v);

export function NewEntryForm({
  ingredients,
  units,
  suppliers,
}: {
  ingredients: IngredientOpt[];
  units: UnitOpt[];
  suppliers: SupplierOpt[];
}) {
  const [state, action, pending] = useActionState<NewEntryState, FormData>(createEntryAction, {});
  const [ingredientId, setIngredientId] = useState("");
  const [purchaseUnitId, setPurchaseUnitId] = useState("");
  const [qty, setQty] = useState("");
  const [productTotal, setProductTotal] = useState("");
  const [freight, setFreight] = useState("0");

  const selectedIng = ingredients.find((i) => i.id === ingredientId);

  // Só unidades da MESMA dimensão do insumo (R6 — prevenção por design).
  const unitOptions = useMemo(() => {
    if (!selectedIng) return [];
    return units.filter((u) => u.dimension === selectedIng.dimension);
  }, [selectedIng, units]);

  const selectedUnit = unitOptions.find((u) => u.id === purchaseUnitId);

  // Prévia ao vivo: custo por unidade-base = (produto + frete) ÷ (qtd × fator).
  const preview = useMemo(() => {
    const q = Number(qty);
    const total = Number(productTotal);
    const f = Number(freight) || 0;
    if (!selectedUnit || !(q > 0) || !(total >= 0)) return null;
    const qtyInBase = q * selectedUnit.toBaseFactor;
    if (!(qtyInBase > 0)) return null;
    return {
      grandTotal: total + f,
      costPerBase: (total + f) / qtyInBase,
      baseUnit: selectedUnit.baseUnit,
    };
  }, [qty, productTotal, freight, selectedUnit]);

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
          onChange={(e) => {
            setIngredientId(e.target.value);
            setPurchaseUnitId("");
          }}
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
          className={selectCls}
          value={purchaseUnitId}
          onChange={(e) => setPurchaseUnitId(e.target.value)}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="purchaseQty">Quantidade</Label>
          <Input
            id="purchaseQty"
            name="purchaseQty"
            type="number"
            step="any"
            min="0"
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="productTotal">Preço total pago (R$)</Label>
          <Input
            id="productTotal"
            name="productTotal"
            type="number"
            step="any"
            min="0"
            required
            value={productTotal}
            onChange={(e) => setProductTotal(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="freightTotal">Frete total (R$)</Label>
          <Input
            id="freightTotal"
            name="freightTotal"
            type="number"
            step="any"
            min="0"
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        O valor que você pagou pelos itens (sem o frete). Ex: comprei 2 kg por R$ 77,80 → digite 77,80.
      </p>

      {preview && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total da compra: </span>
          <span className="font-medium">{brl(preview.grandTotal, 2)}</span>
          <span className="mx-2 text-muted-foreground">•</span>
          <span className="text-muted-foreground">Custo efetivo: </span>
          <span className="font-semibold">
            {brl(preview.costPerBase)} <span className="font-normal text-muted-foreground">/{preview.baseUnit}</span>
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="supplierName">Fornecedor (opcional)</Label>
        <Input
          id="supplierName"
          name="supplierName"
          list="suppliers-list"
          placeholder="Ex: Atacado Bom Preço"
          autoComplete="off"
        />
        <datalist id="suppliers-list">
          {suppliers.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Registrando…" : "Registrar compra"}
      </Button>
    </form>
  );
}
