import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
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

export default async function ReposicaoPage() {
  const workspaceId = await requireWorkspaceId();
  // Só faz sentido alertar quem tem um mínimo definido (> 0).
  const ingredients = await prisma.ingredient.findMany({
    where: { workspaceId, minStockQty: { gt: 0 } },
    include: { category: true, baseUnit: true },
    orderBy: { name: "asc" },
  });

  // Prisma não compara duas colunas no where; filtramos em memória.
  const toRestock = ingredients
    .map((i) => {
      const stock = Number(i.stockQty);
      const min = Number(i.minStockQty);
      return { i, stock, min, gap: min - stock };
    })
    .filter((x) => x.gap > 0) // estoque ABAIXO do mínimo (ao atingir o mínimo, sai da lista)
    .sort((a, b) => b.gap - a.gap); // mais críticos primeiro

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Reposição</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Insumos abaixo do estoque mínimo — hora de comprar.
        </p>

        <Card className="mt-6">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Faltam</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toRestock.map(({ i, stock, min, gap }) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">
                      {i.name}
                      {i.brand && (
                        <span className="ml-2 font-normal text-muted-foreground">{i.brand}</span>
                      )}
                    </TableCell>
                    <TableCell>{i.category.name}</TableCell>
                    <TableCell className="text-right tabular-nums text-red-600">
                      {stock.toLocaleString("pt-BR")} {i.baseUnit.baseUnit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {min.toLocaleString("pt-BR")} {i.baseUnit.baseUnit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {gap.toLocaleString("pt-BR")} {i.baseUnit.baseUnit}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href="/simulador"
                          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Simular
                        </Link>
                        <Link href="/entradas/nova" className={buttonVariants({ size: "sm" })}>
                          Comprar
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {toRestock.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                ✅ Tudo em dia — nenhum insumo abaixo do estoque mínimo.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
