"use client";

import { useActionState } from "react";
import { createUnitAction, type UnitFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectCls =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export function NewUnitForm() {
  const [state, action, pending] = useActionState<UnitFormState, FormData>(
    createUnitAction,
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

      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="ex: kg, L, caixa, dúzia" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="baseUnit">Unidade base</Label>
        <select id="baseUnit" name="baseUnit" required className={selectCls}>
          <option value="">Selecione…</option>
          <option value="g">g — gramas</option>
          <option value="ml">ml — mililitros</option>
          <option value="un">un — unidades</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Tudo é convertido para a unidade base internamente.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="toBaseFactor">Fator de conversão</Label>
        <Input
          id="toBaseFactor"
          name="toBaseFactor"
          type="number"
          step="any"
          min="0.000001"
          placeholder="ex: 1000 para kg→gr"
          required
        />
        <p className="text-xs text-muted-foreground">
          Quantas unidades base equivalem a 1 desta unidade. Ex: 1 kg = 1000 gr → fator 1000.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Criando…" : "Criar unidade"}
      </Button>
    </form>
  );
}
