import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UnidadesPage() {
  const workspaceId = await requireWorkspaceId();
  const units = await prisma.unit.findMany({
    where: { workspaceId },
    orderBy: [{ baseUnit: "asc" }, { toBaseFactor: "asc" }],
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Unidades de medida</h1>
            <p className="text-sm text-muted-foreground">
              Unidades disponíveis para compra e cadastro de insumos.
            </p>
          </div>
          <Link
            href="/unidades/nova"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            Nova unidade
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unidades cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma unidade cadastrada. Crie a primeira para começar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Unidade base</TableHead>
                    <TableHead className="text-right">Fator de conversão</TableHead>
                    <TableHead>Exemplo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.baseUnit}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(u.toBaseFactor).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        1 {u.name} = {Number(u.toBaseFactor).toLocaleString("pt-BR")} {u.baseUnit}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/unidades/${u.id}/editar`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Editar
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
