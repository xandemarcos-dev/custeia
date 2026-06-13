import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { formatBRL } from "@/lib/format";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { categoryChip } from "@/lib/categoryChip";
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

        <Card className="hidden md:block">
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
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${categoryChip(
                          ing.category.name
                        )}`}
                      >
                        {ing.category.name}
                      </span>
                    </TableCell>
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
          </CardContent>
        </Card>

        {/* Mobile: cada insumo como card empilhado */}
        <div className="space-y-2.5 md:hidden">
          {ingredients.map((ing) => (
            <div key={ing.id} className="rounded-2xl bg-card p-4 ring-1 ring-[#e8ebef]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#16202b]">
                    {ing.name}
                    {ing.brand && (
                      <span className="ml-1.5 font-normal text-muted-foreground">{ing.brand}</span>
                    )}
                  </p>
                  <span
                    className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${categoryChip(
                      ing.category.name
                    )}`}
                  >
                    {ing.category.name}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold tabular-nums text-[#16202b]">
                    {formatBRL(Number(ing.avgCost))}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{ing.baseUnit.baseUnit}
                    </span>
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {Number(ing.stockQty).toLocaleString("pt-BR")} {ing.baseUnit.baseUnit} em estoque
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 border-t border-[#eef1f3] pt-2.5 text-sm font-medium">
                <Link
                  href={`/insumos/${ing.id}/compras`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Compras
                </Link>
                <Link href={`/insumos/${ing.id}/editar`} className="text-primary hover:underline">
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>

        {ingredients.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            Nenhum insumo ainda. Clique em &ldquo;Novo insumo&rdquo;.
          </p>
        )}
      </main>
    </>
  );
}
