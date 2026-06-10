import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";

const navItems = [
  { href: "/ingredientes", label: "Insumos" },
  { href: "/receitas", label: "Produtos" },
  { href: "/margem", label: "Margem" },
  { href: "/simulador", label: "Simular" },
  { href: "/unidades", label: "Unidades" },
];

async function getRestockCount(): Promise<number> {
  // Fora do try: se requireWorkspaceId redirecionar, o redirect deve propagar
  // (não pode ser engolido pelo catch).
  const workspaceId = await requireWorkspaceId();
  try {
    const ings = await prisma.ingredient.findMany({
      where: { workspaceId, minStockQty: { gt: 0 } },
      select: { stockQty: true, minStockQty: true },
    });
    return ings.filter((i) => Number(i.stockQty) < Number(i.minStockQty)).length;
  } catch {
    return 0;
  }
}

export async function Header() {
  const restock = await getRestockCount();

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#182131] text-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-6">
        <Link href="/ingredientes" className="flex items-center" aria-label="BatchFlow — início">
          <span className="text-lg font-semibold tracking-tight text-white">
            Batch<span className="text-[#2bc4b0]">Flow</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/reposicao"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Reposição
            {restock > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs font-medium text-white">
                {restock}
              </span>
            )}
          </Link>
        </nav>
        <div className="ml-auto flex items-center">
          <Show when="signed-out">
            <SignInButton />
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
