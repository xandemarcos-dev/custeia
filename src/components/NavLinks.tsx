"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

const navItems: NavItem[] = [
  { href: "/ingredientes", label: "Insumos" },
  { href: "/categorias", label: "Categorias" },
  { href: "/receitas", label: "Produtos" },
  { href: "/producao/nova", label: "Produção" },
  { href: "/margem", label: "Margem" },
  { href: "/simulador", label: "Simular" },
  { href: "/unidades", label: "Unidades" },
  { href: "/reposicao", label: "Reposição" },
];

function section(href: string): string {
  return "/" + href.split("/")[1];
}

export function NavLinks({ restock }: { restock: number }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const seg = section(item.href);
        const active = pathname === seg || pathname.startsWith(seg + "/");
        const isRestock = item.href === "/reposicao";

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] font-semibold transition-colors ${
              active
                ? "bg-[#2dd4bf]/15 text-[#5eead4]"
                : "text-white/75 hover:bg-[#2dd4bf]/15 hover:text-[#5eead4]"
            }`}
          >
            {item.label}
            {isRestock && restock > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs font-medium text-white">
                {restock}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}
