import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimuladorForm } from "./SimuladorForm";

export const dynamic = "force-dynamic";

export default async function SimuladorPage() {
  const [ingredients, units] = await Promise.all([
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Simulador de compra</CardTitle>
            <p className="text-sm text-muted-foreground">
              Veja o impacto de uma compra no custo médio e na margem — sem registrar nada.
            </p>
          </CardHeader>
          <CardContent>
            <SimuladorForm ingredients={ingredients} units={units} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
