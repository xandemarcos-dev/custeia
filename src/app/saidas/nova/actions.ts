"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { registerManualExit } from "@/services/registerManualExit";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ManualExitState = { error?: string };

export async function createManualExitAction(
  _prev: ManualExitState,
  formData: FormData
): Promise<ManualExitState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const ingredientId = String(formData.get("ingredientId") ?? "");
  const qtyInBase = Number(formData.get("qtyInBase"));
  const source = String(formData.get("source") ?? "") as "adjustment" | "waste" | "other";
  const exitDateStr = String(formData.get("exitDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!ingredientId) return { error: "Selecione o insumo." };
  if (!(qtyInBase > 0)) return { error: "A quantidade deve ser maior que zero." };
  if (!["adjustment", "waste", "other"].includes(source)) return { error: "Motivo inválido." };
  if (!exitDateStr) return { error: "Informe a data." };

  const exitDate = new Date(`${exitDateStr}T12:00:00Z`);
  if (isNaN(exitDate.getTime())) return { error: "Data inválida." };

  try {
    const workspaceId = await requireWorkspaceId();
    const ingredient = await prisma.ingredient.findFirst({
      where: { id: ingredientId, workspaceId },
      select: { id: true },
    });
    if (!ingredient) return { error: "Insumo inválido." };

    await registerManualExit({ workspaceId, ingredientId, qtyInBase, source, exitDate, notes });
  } catch (e) {
    if (e instanceof Error && (e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { error: e instanceof Error ? e.message : "Falha ao registrar saída." };
  }

  revalidatePath("/ingredientes");
  redirect("/ingredientes?ok=saida");
}
