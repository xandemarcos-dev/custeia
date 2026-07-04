import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { formatBRL } from "@/lib/format";
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
import { DeleteEntryButton } from "./DeleteEntryButton";

export const dynamic = "force-dynamic";

export default async function ComprasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspaceId = await requireWorkspaceId();
  const ingredient = await prisma.ingredient.findFirst({
    where: { id, workspaceId },
    include: {
      baseUnit: true,
      entries: {
        orderBy: [{ entryDate: "desc" }, { id: "desc" }],
        include: { purchaseUnit: true, supplier: true },
      },
    },
  });
  if (!ingredient) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Compras — {ingredient.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Custo médio atual: {formatBRL(Number(ingredient.avgCost))} /{ingredient.baseUnit.baseUnit}
              {" · "}Estoque: {Number(ingredient.stockQty).toLocaleString("pt-BR")} {ingredient.baseUnit.baseUnit}
            </p>
          </div>
          <Link href="/entradas/nova" className={buttonVariants()}>
            Nova compra
          </Link>
        </div>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço un.</TableHead>
                  <TableHead className="text-right">Frete</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Custo médio após</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredient.entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.entryDate.toLocaleDateString("pt-BR", { timeZone: "UTC" })}</TableCell>
                    <TableCell className="text-muted-foreground">{e.supplier?.name ?? "—"}</TableCell>
                    <TableCell>{e.purchaseUnit.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(e.purchaseQty)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(Number(e.unitPrice), 2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(Number(e.freightTotal), 2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(Number(e.totalCost), 2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(Number(e.avgCostAfter))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/insumos/${id}/compras/${e.id}/editar`}
                          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Editar
                        </Link>
                        <DeleteEntryButton entryId={e.id} ingredientId={id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {ingredient.entries.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">Nenhuma compra ainda.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
