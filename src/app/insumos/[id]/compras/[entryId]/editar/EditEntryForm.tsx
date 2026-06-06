"use client";

import { useActionState } from "react";
import { updateEntryAction, type EditEntryState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Unit = { id: string; name: string };
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

export function EditEntryForm({ entry, units }: { entry: Entry; units: Unit[] }) {
  const [state, action, pending] = useActionState<EditEntryState, FormData>(updateEntryAction, {});

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
        <select id="purchaseUnitId" name="purchaseUnitId" required defaultValue={entry.purchaseUnitId} className={selectCls}>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="purchaseQty">Quantidade</Label>
          <Input id="purchaseQty" name="purchaseQty" type="number" step="any" min="0" required defaultValue={entry.purchaseQty} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unitPrice">Preço un. (R$)</Label>
          <Input id="unitPrice" name="unitPrice" type="number" step="any" min="0" required defaultValue={entry.unitPrice} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="freightTotal">Frete (R$)</Label>
          <Input id="freightTotal" name="freightTotal" type="number" step="any" min="0" defaultValue={entry.freightTotal} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando…" : "Salvar e recalcular"}
      </Button>
    </form>
  );
}
