import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { formatBRL } from "@/lib/format";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const workspaceId = await requireWorkspaceId();
  const ingredients = await prisma.ingredient.findMany({
    where: { workspaceId },
    include: { category: true, baseUnit: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Insumos"
          description="Custo médio ponderado móvel de cada insumo."
          actions={
            <>
              <Link href="/insumos/novo" className={buttonVariants({ variant: "outline" })}>
                Novo insumo
              </Link>
              <Link href="/entradas/nova" className={buttonVariants()}>
                Nova compra
              </Link>
            </>
          }
        />

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Custo médio</TableHead>
                  <TableHead className="w-10"></TableHead>
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/insumos/${ing.id}/compras`}
                          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Compras
                        </Link>
                        <Link
                          href={`/insumos/${ing.id}/editar`}
                          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Editar
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {ingredients.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum insumo ainda. Clique em &ldquo;Novo insumo&rdquo;.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
