"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspaceId } from "@/lib/workspace";
import { registerProduction } from "@/services/registerProduction";

export type NewProductionState = { error?: string };

export async function createProductionAction(
  _prev: NewProductionState,
  formData: FormData
): Promise<NewProductionState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const recipeId = String(formData.get("recipeId") ?? "");
  const batchCount = Number(formData.get("batchCount"));
  const notes = String(formData.get("notes") ?? "") || null;

  if (!recipeId) return { error: "Selecione a receita produzida." };
  if (!(batchCount > 0)) return { error: "Informe quantos lotes foram produzidos." };

  const workspaceId = await requireWorkspaceId();

  try {
    await registerProduction({
      workspaceId,
      recipeId,
      batchCount,
      productionDate: new Date(),
      notes,
    });
  } catch (e) {
    if (e instanceof Error && (e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { error: e instanceof Error ? e.message : "Falha ao registrar produção." };
  }

  revalidatePath("/ingredientes");
  revalidatePath("/reposicao");
  revalidatePath("/producao");
  redirect("/ingredientes?ok=producao");
}
