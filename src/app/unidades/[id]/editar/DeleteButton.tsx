"use client";

import { deleteUnitAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteButton({ id, inUse }: { id: string; inUse: boolean }) {
  if (inUse) {
    return (
      <p className="text-sm text-muted-foreground">
        Não é possível excluir: a unidade está em uso em insumos ou compras.
      </p>
    );
  }

  return (
    <form
      action={deleteUnitAction}
      onSubmit={(e) => {
        if (!confirm("Excluir esta unidade? Esta ação não pode ser desfeita.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive">
        Excluir unidade
      </Button>
    </form>
  );
}
