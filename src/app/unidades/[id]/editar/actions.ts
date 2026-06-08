"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EditUnitState = { error?: string };

/** Conta quantas vezes a unidade é referenciada (insumos + compras). */
async function countUsage(unitId: string): Promise<number> {
  const [asBase, asPurchase] = await Promise.all([
    prisma.ingredient.count({ where: { baseUnitId: unitId } }),
    prisma.ingredientEntry.count({ where: { purchaseUnitId: unitId } }),
  ]);
  return asBase + asPurchase;
}

export async function updateUnitAction(
  _prev: EditUnitState,
  formData: FormData
): Promise<EditUnitState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const baseUnit = String(formData.get("baseUnit") ?? "").trim();
  const toBaseFactor = Number(formData.get("toBaseFactor"));

  if (!id) return { error: "Unidade inválida." };
  if (!name) return { error: "O nome da unidade é obrigatório." };

  const workspaceId = await requireWorkspaceId();
  const unit = await prisma.unit.findFirst({ where: { id, workspaceId } });
  if (!unit) return { error: "Unidade não encontrada." };

  // Bloqueia nome duplicado (ignorando caixa/espaços) no mesmo workspace, exceto ela mesma.
  const dup = await prisma.unit.findFirst({
    where: {
      workspaceId,
      name: { equals: name, mode: "insensitive" },
      id: { not: id },
    },
    select: { id: true },
  });
  if (dup) return { error: `Já existe uma unidade chamada "${name}".` };

  const inUse = (await countUsage(id)) > 0;

  if (inUse) {
    // Em uso: só o nome (cosmético) pode mudar. Fator/base ficam congelados
    // para não corromper o histórico de compras já calculado.
    await prisma.unit.update({ where: { id }, data: { name } });
  } else {
    // Nunca usada: pode corrigir tudo.
    if (!baseUnit) return { error: "A unidade base é obrigatória." };
    if (!(toBaseFactor > 0)) return { error: "O fator de conversão deve ser maior que zero." };
    await prisma.unit.update({
      where: { id },
      data: { name, baseUnit, toBaseFactor },
    });
  }

  revalidatePath("/unidades");
  redirect("/unidades");
}

export async function deleteUnitAction(formData: FormData): Promise<void> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Você precisa estar logado.");

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Unidade inválida.");

  const workspaceId = await requireWorkspaceId();
  const unit = await prisma.unit.findFirst({ where: { id, workspaceId }, select: { id: true } });
  if (!unit) throw new Error("Unidade não encontrada.");

  // Trava de integridade: só exclui se nenhum insumo ou compra usar a unidade.
  if ((await countUsage(id)) > 0) {
    redirect(`/unidades/${id}/editar?erro=em-uso`);
  }

  await prisma.unit.delete({ where: { id } });
  revalidatePath("/unidades");
  redirect("/unidades");
}
