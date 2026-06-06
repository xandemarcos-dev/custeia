"use client";

import { deleteRecipeAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteRecipeButton({ id }: { id: string }) {
  return (
    <form
      action={deleteRecipeAction}
      onSubmit={(e) => {
        if (!confirm("Excluir este produto e sua ficha técnica? Não pode ser desfeito.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive">
        Excluir produto
      </Button>
    </form>
  );
}
