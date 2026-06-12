"use client";

import { useActionState, useMemo, useState } from "react";
import { updateEntryAction, type EditEntryState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Unit = { id: string; name: string; baseUnit: string; toBaseFactor: number };
type Entry = {
  id: string;
  ingredientId: string;
  purchaseUnitId: string;
  purchaseQty: number;
  unitPrice: number;
  freightTotal: number;
  entryDate: string;
};

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const brl = (v: number, d = 4) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: d,
  }).format(v);

export function EditEntryForm({ entry, units }: { entry: Entry; units: Unit[] }) {
  const [state, action, pending] = useActionState<EditEntryState, FormData>(updateEntryAction, {});

  const [purchaseUnitId, setPurchaseUnitId] = useState(entry.purchaseUnitId);
  const [qty, setQty] = useState(String(entry.purchaseQty));
  // Total pago (sem frete) = preço unitário × quantidade.
  const [total, setTotal] = useState(String(entry.unitPrice * entry.purchaseQty));
  const [freight, setFreight] = useState(String(entry.freightTotal));

  const selectedUnit = units.find((u) => u.id === purchaseUnitId);

  const preview = useMemo(() => {
    const q = Number(qty);
    const t = Number(total);
    const f = Number(freight) || 0;
    if (!selectedUnit || !(q > 0) || !(t >= 0)) return null;
    const qtyInBase = q * selectedUnit.toBaseFactor;
    if (!(qtyInBase > 0)) return null;
    return {
      grandTotal: t + f,
      costPerBase: (t + f) / qtyInBase,
      baseUnit: selectedUnit.baseUnit,
    };
  }, [qty, total, freight, selectedUnit]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="entryId" value={entry.id} />
      <input type="hidden" name="ingredientId" value={entry.ingredientId} />
      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="entryDate">Data</Label>
        <Input id="entryDate" name="entryDate" type="date" required defaultValue={entry.entryDate} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="purchaseUnitId">Unidade de compra</Label>
        <select
          id="purchaseUnitId"
          name="purchaseUnitId"
          required
          className={selectCls}
          value={purchaseUnitId}
          onChange={(e) => setPurchaseUnitId(e.target.value)}
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
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
          <Label htmlFor="productTotal">Preço total (R$)</Label>
          <Input
            id="productTotal"
            name="productTotal"
            type="number"
            step="any"
            min="0"
            required
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="freightTotal">Frete (R$)</Label>
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

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando…" : "Salvar e recalcular"}
      </Button>
    </form>
  );
}
