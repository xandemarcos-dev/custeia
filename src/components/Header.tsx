import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/ingredientes", label: "Insumos" },
  { href: "/receitas", label: "Produtos" },
  { href: "/margem", label: "Margem" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        <Link
          href="/ingredientes"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground">
            R
          </span>
          Rixan
        </Link>
        <nav className="flex gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
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
