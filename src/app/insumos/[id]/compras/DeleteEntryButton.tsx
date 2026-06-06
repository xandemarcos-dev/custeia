"use client";

import { deleteEntryAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteEntryButton({
  entryId,
  ingredientId,
}: {
  entryId: string;
  ingredientId: string;
}) {
  return (
    <form
      action={deleteEntryAction}
      onSubmit={(e) => {
        if (!confirm("Excluir esta compra? O custo médio será recalculado.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="ingredientId" value={ingredientId} />
      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
        Excluir
      </Button>
    </form>
  );
}
