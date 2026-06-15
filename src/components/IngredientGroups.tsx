"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Sequência só para gerar `key` de React (não vai pro DOM nem pro servidor).
let keySeq = 0;
const nextKey = () => ++keySeq;

type Option = { id: string; name: string; baseUnit: string };
type InitialItem = { ingredientId: string; qtyInBase: number };
type InitialGroup = { name: string; items: InitialItem[] };

type Row = { key: number; ingredientId: string; qty: number | undefined };
type Group = { key: number; name: string; rows: Row[] };

const selectCls =
  "flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

/**
 * Editor da ficha técnica com grupos nomeados (ex.: "Massa", "Cobertura").
 * Emite, por grupo, um campo `groupName`; e por linha, os campos `ingredientGroup`
 * (índice do grupo), `ingredientId` e `qtyInBase` — reconstruídos no servidor por
 * parseRecipeGroupsFromForm.
 */
export function IngredientGroups({
  ingredients,
  initialGroups,
}: {
  ingredients: Option[];
  initialGroups?: InitialGroup[];
}) {
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  function emptyRow(): Row {
    return { key: nextKey(), ingredientId: "", qty: undefined };
  }

  const [groups, setGroups] = useState<Group[]>(() => {
    if (initialGroups && initialGroups.length > 0) {
      return initialGroups.map((g) => ({
        key: nextKey(),
        name: g.name,
        rows:
          g.items.length > 0
            ? g.items.map((it) => ({ key: nextKey(), ingredientId: it.ingredientId, qty: it.qtyInBase }))
            : [emptyRow()],
      }));
    }
    return [{ key: nextKey(), name: "Massa", rows: [emptyRow()] }];
  });

  function addGroup() {
    setGroups((g) => [...g, { key: nextKey(), name: "", rows: [emptyRow()] }]);
  }
  function removeGroup(gkey: number) {
    setGroups((g) => (g.length > 1 ? g.filter((x) => x.key !== gkey) : g));
  }
  function setGroupName(gkey: number, name: string) {
    setGroups((g) => g.map((x) => (x.key === gkey ? { ...x, name } : x)));
  }
  function addRow(gkey: number) {
    setGroups((g) => g.map((x) => (x.key === gkey ? { ...x, rows: [...x.rows, emptyRow()] } : x)));
  }
  function removeRow(gkey: number, rkey: number) {
    setGroups((g) =>
      g.map((x) =>
        x.key === gkey ? { ...x, rows: x.rows.length > 1 ? x.rows.filter((r) => r.key !== rkey) : x.rows } : x
      )
    );
  }
  function setIngredient(gkey: number, rkey: number, id: string) {
    setGroups((g) =>
      g.map((x) =>
        x.key === gkey ? { ...x, rows: x.rows.map((r) => (r.key === rkey ? { ...r, ingredientId: id } : r)) } : x
      )
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group, gi) => (
        <div key={group.key} className="rounded-xl border border-input/70 bg-muted/30 p-3">
          <div className="mb-2.5 flex items-center gap-2">
            <Input
              name="groupName"
              value={group.name}
              onChange={(e) => setGroupName(group.key, e.target.value)}
              placeholder={gi === 0 ? "Massa" : `Grupo ${gi + 1} (ex: Cobertura)`}
              aria-label={`Nome do grupo ${gi + 1}`}
              className="h-8 max-w-xs font-semibold"
            />
            {groups.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeGroup(group.key)}
                className="ml-auto text-muted-foreground"
              >
                Remover grupo
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {group.rows.map((row) => {
              const unit = byId.get(row.ingredientId)?.baseUnit;
              return (
                <div key={row.key} className="flex items-center gap-2">
                  <input type="hidden" name="ingredientGroup" value={gi} />
                  <select
                    name="ingredientId"
                    value={row.ingredientId}
                    onChange={(e) => setIngredient(group.key, row.key, e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Insumo…</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name}
                      </option>
                    ))}
                  </select>
                  <div className="relative w-44">
                    <Input
                      name="qtyInBase"
                      type="number"
                      step="any"
                      min="0"
                      defaultValue={row.qty}
                      placeholder="quantidade"
                      className="pr-12"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      {unit ?? ""}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(group.key, row.key)}
                    aria-label="Remover insumo"
                  >
                    ✕
                  </Button>
                </div>
              );
            })}
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => addRow(group.key)}
              className="px-0"
            >
              + adicionar insumo
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addGroup}>
        + adicionar grupo
      </Button>
    </div>
  );
}
