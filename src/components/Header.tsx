import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/workspace";
import { NavLinks } from "@/components/NavLinks";

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
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-6 md:h-16">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform duration-150 hover:scale-[1.04] active:scale-100"
            aria-label="BatchFlow — início"
          >
            <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[#161c29] shadow-[0_2px_10px_rgba(45,212,191,0.22),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 120 120"
                aria-hidden="true"
                className="transition-transform duration-150 group-hover:scale-110"
              >
                <defs>
                  <linearGradient
                    id="bf-mark"
                    x1="24"
                    y1="20"
                    x2="96"
                    y2="100"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#6ff0dc" />
                    <stop offset="0.5" stopColor="#2dd4bf" />
                    <stop offset="1" stopColor="#11a594" />
                  </linearGradient>
                </defs>
                <g fill="none" stroke="url(#bf-mark)" strokeWidth="17" strokeLinejoin="round">
                  <path d="M62,14 L50,42 Q26,44 26,55 Q26,66 44,62" />
                  <path
                    d="M62,14 L50,42 Q26,44 26,55 Q26,66 44,62"
                    transform="rotate(180 60 60)"
                  />
                </g>
              </svg>
            </span>
            <span className="text-[19px] font-extrabold tracking-tight text-white">
              Batch
              <span className="text-[#2bc4b0] transition-colors duration-150 group-hover:text-[#5eead4]">
                Flow
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex md:flex-1 md:justify-center">
            <NavLinks restock={restock} />
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/ajuda"
              aria-label="Ajuda"
              className="flex size-9 items-center justify-center rounded-full text-[#2dd4bf] transition-colors hover:bg-[#2dd4bf]/15 hover:text-[#5eead4]"
            >
              <HelpCircle className="size-[18px]" />
            </Link>
            <Show when="signed-out">
              <SignInButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
        <nav className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 pb-2 text-sm md:hidden">
          <NavLinks restock={restock} />
        </nav>
      </div>
    </header>
  );
}
