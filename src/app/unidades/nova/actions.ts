"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type UnitFormState = { error?: string };

export async function createUnitAction(
  _prev: UnitFormState,
  formData: FormData
): Promise<UnitFormState> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return { error: "Você precisa estar logado." };

  const name = String(formData.get("name") ?? "").trim();
  const baseUnit = String(formData.get("baseUnit") ?? "").trim();
  const toBaseFactor = Number(formData.get("toBaseFactor"));

  if (!name) return { error: "O nome da unidade é obrigatório." };
  if (!baseUnit) return { error: "A unidade base é obrigatória." };
  if (!(toBaseFactor > 0)) return { error: "O fator de conversão deve ser maior que zero." };

  // Mesma realidade do resto do app: workspace único existente.
  const workspace = await prisma.workspace.findFirstOrThrow({
    select: { id: true },
  });

  // Bloqueia duplicado por nome (ignorando caixa/espaços) no mesmo workspace.
  const dup = await prisma.unit.findFirst({
    where: {
      workspaceId: workspace.id,
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (dup) return { error: `Já existe uma unidade chamada "${name}".` };

  await prisma.unit.create({
    data: { workspaceId: workspace.id, name, baseUnit, toBaseFactor },
  });

  revalidatePath("/unidades");
  redirect("/unidades");
}
