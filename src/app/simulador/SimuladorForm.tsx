"use client";

import { useActionState } from "react";
import { simulateAction, type SimState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Option = { id: string; name: string };

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const brl = (v: number, d = 4) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: d,
  }).format(v);

export function SimuladorForm({
  ingredients,
  units,
}: {
  ingredients: Option[];
  units: Option[];
}) {
  const [state, action, pending] = useActionState<SimState, FormData>(simulateAction, {});
  const r = state.result;

  return (
    <div className="space-y-6">
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
          <Label htmlFor="ingredientId">Insumo</Label>
          <select id="ingredientId" name="ingredientId" required className={selectCls}>
            <option value="">Selecione…</option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="purchaseUnitId">Unidade de compra</Label>
          <select id="purchaseUnitId" name="purchaseUnitId" required className={selectCls}>
            <option value="">Selecione…</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="purchaseQty">Quantidade</Label>
            <Input id="purchaseQty" name="purchaseQty" type="number" step="any" min="0" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unitPrice">Preço/unidade (R$)</Label>
            <Input id="unitPrice" name="unitPrice" type="number" step="any" min="0" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="freightTotal">Frete (R$)</Label>
            <Input id="freightTotal" name="freightTotal" type="number" step="any" min="0" defaultValue="0" />
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Simulando…" : "Simular"}
        </Button>
      </form>

      {r && (
        <div className="rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Custo médio de {r.ingredientName}</p>
              <p className="text-lg">
                <span className="text-muted-foreground line-through">{brl(r.currentAvg)}</span>
                {" → "}
                <span className="font-semibold">{brl(r.newAvgCost)}</span>
                <span className="text-sm text-muted-foreground"> /{r.baseUnit}</span>
              </p>
            </div>
            <Badge className={r.deltaAvgCost <= 0 ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
              {r.deltaAvgCost <= 0 ? "▼" : "▲"} {brl(Math.abs(r.deltaAvgCost))}
            </Badge>
          </div>
          <p className="mt-3 text-sm">
            {r.worthStocking
              ? "✅ Esta compra ABAIXA seu custo médio — vale estocar."
              : "⚠️ Esta compra NÃO abaixa seu custo médio. Só estoque se precisar do insumo."}
          </p>

          {r.recipes.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Impacto na margem dos produtos</p>
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
                        <span className={rec.belowTarget ? "font-medium text-red-600" : "font-medium text-green-600"}>
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
