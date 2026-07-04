import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ManualExitForm } from "./ManualExitForm";

export const dynamic = "force-dynamic";

export default async function NovaSaidaPage() {
  const workspaceId = await requireWorkspaceId();
  const ingredients = await prisma.ingredient.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    include: { baseUnit: true },
  });

  const opts = ingredients.map((ing) => ({
    id: ing.id,
    name: ing.name,
    baseUnit: ing.baseUnit.baseUnit,
    stockQty: Number(ing.stockQty),
  }));

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Registrar saída"
          description="Registre perdas, descartes ou ajustes de estoque."
        />
        <Card>
          <CardContent className="pt-6">
            <ManualExitForm ingredients={opts} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
