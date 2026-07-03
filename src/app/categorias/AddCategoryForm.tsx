"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCategoryAction, type CategoryActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddCategoryForm() {
  const [state, action, pending] = useActionState<CategoryActionState, FormData>(
    createCategoryAction,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setTouched(false);
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="name">Nova categoria</Label>
        <Input
          id="name"
          name="name"
          placeholder="ex: Frutas secas"
          required
          onChange={() => setTouched(true)}
          aria-describedby={state.error ? "cat-error" : state.success && !touched ? "cat-success" : undefined}
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
        {state.success && !touched && (
          <p
            id="cat-success"
            role="status"
            className="text-sm text-emerald-600"
          >
            Categoria adicionada com sucesso.
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="shrink-0">
        {pending ? "Adicionando…" : "Adicionar"}
      </Button>
    </form>
  );
}
