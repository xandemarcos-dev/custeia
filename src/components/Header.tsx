import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
        <Link href="/ingredientes" className="text-lg font-semibold tracking-tight">
          Rixan
        </Link>
        <nav className="flex gap-4 text-sm text-black/70 dark:text-white/70">
          <Link href="/ingredientes" className="hover:text-black dark:hover:text-white">
            Insumos
          </Link>
          <Link href="/receitas" className="hover:text-black dark:hover:text-white">
            Produtos
          </Link>
          <Link href="/margem" className="hover:text-black dark:hover:text-white">
            Margem
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
