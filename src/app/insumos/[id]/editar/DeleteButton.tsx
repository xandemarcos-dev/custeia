"use client";

import { deleteIngredientAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={deleteIngredientAction}
      onSubmit={(e) => {
        if (!confirm("Excluir este insumo? Esta ação não pode ser desfeita.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive">
        Excluir insumo
      </Button>
    </form>
  );
}
