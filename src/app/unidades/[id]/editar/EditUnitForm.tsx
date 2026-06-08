"use client";

import { useActionState } from "react";
import { updateUnitAction, type EditUnitState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60";

export function EditUnitForm({
  unit,
  inUse,
}: {
  unit: { id: string; name: string; baseUnit: string; toBaseFactor: number };
  inUse: boolean;
}) {
  const [state, action, pending] = useActionState<EditUnitState, FormData>(
    updateUnitAction,
    {}
  );

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <input type="hidden" name="id" value={unit.id} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={unit.name} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="baseUnit">Unidade base</Label>
        <select
          id="baseUnit"
          name="baseUnit"
          required
          defaultValue={unit.baseUnit}
          disabled={inUse}
          className={selectCls}
        >
          <option value="gr">gr — gramas</option>
          <option value="ml">ml — mililitros</option>
          <option value="un">un — unidades</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="toBaseFactor">Fator de conversão</Label>
        <Input
          id="toBaseFactor"
          name="toBaseFactor"
          type="number"
          step="any"
          min="0.000001"
          defaultValue={unit.toBaseFactor}
          disabled={inUse}
        />
        <p className="text-xs text-muted-foreground">
          Quantas unidades base equivalem a 1 desta unidade. Ex: 1 kg = 1000 gr → fator 1000.
        </p>
      </div>

      {inUse && (
        <p className="rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Esta unidade já está em uso em insumos ou compras. Para preservar o histórico
          de custos, só o <strong>nome</strong> pode ser alterado. O fator e a unidade base
          ficam bloqueados — se estiverem errados, crie uma unidade nova e faça um ajuste de estoque.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
