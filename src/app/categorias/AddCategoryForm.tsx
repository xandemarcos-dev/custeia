"use client";

import { useActionState } from "react";
import { createCategoryAction, type CategoryActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddCategoryForm() {
  const [state, action, pending] = useActionState<CategoryActionState, FormData>(
    createCategoryAction,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="name">Nova categoria</Label>
        <Input
          id="name"
          name="name"
          placeholder="ex: Frutas secas"
          required
          aria-describedby={state.error ? "cat-error" : undefined}
        />
        {state.error && (
          <p
            id="cat-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="shrink-0">
        {pending ? "Adicionando…" : "Adicionar"}
      </Button>
    </form>
  );
}
