import Image from "next/image";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/ingredientes", label: "Insumos" },
  { href: "/receitas", label: "Produtos" },
  { href: "/margem", label: "Margem" },
  { href: "/simulador", label: "Simular" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#182131] text-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-6">
        <Link href="/ingredientes" className="flex items-center" aria-label="Rixan — início">
          <Image
            src="/rixan-logo.png"
            alt="Rixan"
            width={376}
            height={368}
            priority
            className="h-9 w-auto"
          />
        </Link>
        <nav className="flex gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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
