"use client";

import { useActionState, useMemo, useState } from "react";
import { simulateAction, type SimState, type ScenarioResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Dimension } from "@/lib/dimension";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type IngredientOption = { id: string; name: string; dimension: Dimension };
type UnitOption = {
  id: string;
  name: string;
  dimension: Dimension;
  baseUnit: string;
  toBaseFactor: number;
};

const selectCls =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const brl = (v: number, d = 4) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: d,
  }).format(v);

function ScenarioFields({
  suffix,
  units,
  disabled,
  freight,
  onFreightChange,
}: {
  suffix: "A" | "B";
  units: UnitOption[];
  disabled: boolean;
  freight: string;
  onFreightChange: (v: string) => void;
}) {
  const [unitId, setUnitId] = useState("");
  const [qty, setQty] = useState("");
  const [total, setTotal] = useState("");

  const selectedUnit = units.find((u) => u.id === unitId);

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
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">
        Fornecedor {suffix}
        {suffix === "B" && <span className="font-normal text-muted-foreground"> (opcional)</span>}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor={`unit${suffix}`}>Unidade de compra</Label>
        <select
          id={`unit${suffix}`}
          name={`purchaseUnitId${suffix}`}
          className={`${selectCls} disabled:cursor-not-allowed disabled:opacity-60`}
          required={suffix === "A"}
          disabled={disabled}
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
        >
          <option value="">{disabled ? "Escolha o insumo primeiro" : "Selecione…"}</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`qty${suffix}`}>Qtd</Label>
          <Input
            id={`qty${suffix}`}
            name={`purchaseQty${suffix}`}
            type="number"
            step="any"
            min="0"
            required={suffix === "A"}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`total${suffix}`}>Preço total (R$)</Label>
          <Input
            id={`total${suffix}`}
            name={`productTotal${suffix}`}
            type="number"
            step="any"
            min="0"
            required={suffix === "A"}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`freight${suffix}`}>Frete total (R$)</Label>
          <Input
            id={`freight${suffix}`}
            name={`freightTotal${suffix}`}
            type="number"
            step="any"
            min="0"
            value={freight}
            onChange={(e) => onFreightChange(e.target.value)}
          />
        </div>
      </div>
      {preview && (
        <p className="text-xs text-muted-foreground">
          Total {brl(preview.grandTotal, 2)} • efetivo{" "}
          <span className="font-medium text-foreground">
            {brl(preview.costPerBase)}/{preview.baseUnit}
          </span>
        </p>
      )}
    </div>
  );
}

function ScenarioCard({
  title,
  s,
  baseUnit,
  highlight,
}: {
  title: string;
  s: ScenarioResult;
  baseUnit: string;
  highlight: boolean;
}) {
  const productoCost = s.purchaseQty * s.unitPrice;
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "border-primary ring-1 ring-primary" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        {highlight && <Badge>mais barato</Badge>}
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        <p>Produto: {brl(productoCost, 2)}</p>
        <p>Frete: {brl(s.freightTotal, 2)}</p>
        <p className="font-medium text-foreground">Total: {brl(s.totalCost, 2)}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Custo efetivo</p>
      <p className="text-lg font-semibold">
        {brl(s.entryUnitCost)} <span className="text-sm font-normal text-muted-foreground">/{baseUnit}</span>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-1 text-sm">
        Novo custo médio: <span className="font-medium">{brl(s.newAvgCost)}</span>
        <span
          className={`inline-flex items-center gap-0.5 font-medium ${
            s.deltaAvgCost <= 0 ? "text-[#1f9d6b]" : "text-[#c8323c]"
          }`}
        >
          {s.deltaAvgCost <= 0 ? (
            <ArrowDownRight className="size-3.5" />
          ) : (
            <ArrowUpRight className="size-3.5" />
          )}
          {brl(Math.abs(s.deltaAvgCost))}
        </span>
      </p>
    </div>
  );
}

export function SimuladorForm({
  ingredients,
  units,
}: {
  ingredients: IngredientOption[];
  units: UnitOption[];
}) {
  const [state, action, pending] = useActionState<SimState, FormData>(simulateAction, {});
  const [ingredientId, setIngredientId] = useState("");
  const [freightA, setFreightA] = useState("0");
  const [freightB, setFreightB] = useState("0");
  const r = state.result;

  const selectedIng = ingredients.find((i) => i.id === ingredientId);
  // Só unidades da mesma dimensão do insumo (R6 — prevenção por design).
  const unitOptions = useMemo(
    () => (selectedIng ? units.filter((u) => u.dimension === selectedIng.dimension) : []),
    [selectedIng, units]
  );

  return (
    <div className="space-y-6">
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
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ScenarioFields suffix="A" units={unitOptions} disabled={!selectedIng} freight={freightA} onFreightChange={setFreightA} />
          <ScenarioFields suffix="B" units={unitOptions} disabled={!selectedIng} freight={freightB} onFreightChange={setFreightB} />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Simulando…" : "Simular / Comparar"}
        </Button>
      </form>

      {r && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {r.ingredientName} — custo médio atual {brl(r.currentAvg)} /{r.baseUnit}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <ScenarioCard title="Fornecedor A" s={r.a} baseUnit={r.baseUnit} highlight={r.winner === "a"} />
            {r.b && (
              <ScenarioCard title="Fornecedor B" s={r.b} baseUnit={r.baseUnit} highlight={r.winner === "b"} />
            )}
          </div>

          {r.b && r.winner === "empate" && (
            <p className="text-sm text-muted-foreground">Os dois fornecedores dão o mesmo custo.</p>
          )}

          {!r.b && (
            <div
              className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                r.a.worthStocking
                  ? "bg-[#e7f6ee] text-[#1f7a52]"
                  : "bg-[#fbf2e3] text-[#8a5a17]"
              }`}
            >
              {r.a.worthStocking ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              )}
              <span>
                {r.a.worthStocking
                  ? "Esta compra abaixa seu custo médio — vale estocar."
                  : "Esta compra não abaixa seu custo médio. Só estoque se precisar do insumo."}
              </span>
            </div>
          )}

          {r.recipes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">
                Impacto na margem {r.b ? "(cenário mais barato)" : ""}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Margem atual</TableHead>
                    <TableHead className="text-right">Margem simulada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.recipes.map((rec) => (
                    <TableRow key={rec.name}>
                      <TableCell className="font-medium">{rec.name}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {rec.currentMargin.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={`font-bold ${rec.belowTarget ? "text-[#c8323c]" : "text-[#1f9d6b]"}`}
                        >
                          {rec.newMargin.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
