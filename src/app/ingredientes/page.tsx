import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";
import { Header } from "@/components/Header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function IngredientesPage() {
  const ingredients = await prisma.ingredient.findMany({
    include: { category: true, baseUnit: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ingredientes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Custo médio ponderado móvel de cada insumo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/insumos/novo" className={buttonVariants({ variant: "outline" })}>
              Novo insumo
            </Link>
            <Link href="/entradas/nova" className={buttonVariants()}>
              Nova compra
            </Link>
          </div>
        </div>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Custo médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ing) => (
                  <TableRow key={ing.id}>
                    <TableCell className="font-medium">
                      {ing.name}
                      {ing.brand && (
                        <span className="ml-2 font-normal text-muted-foreground">
                          {ing.brand}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{ing.category.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(ing.stockQty).toLocaleString("pt-BR")} {ing.baseUnit.baseUnit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(Number(ing.avgCost))}
                      <span className="text-muted-foreground"> /{ing.baseUnit.baseUnit}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {ingredients.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum ingrediente ainda. Clique em &ldquo;Novo insumo&rdquo;.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
