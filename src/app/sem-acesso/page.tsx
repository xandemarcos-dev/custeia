import { SignOutButton } from "@clerk/nextjs";
import { BrandMark } from "@/components/BrandMark";

export default function SemAcessoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <BrandMark />
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#16202b]">
          Acesso não autorizado
        </h1>
        <p className="mt-2 text-[15px] font-medium text-muted-foreground">
          Sua conta não tem acesso a este espaço de trabalho. Fale com o administrador para ser
          liberado.
        </p>
      </div>
      <SignOutButton>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Sair
        </button>
      </SignOutButton>
    </main>
  );
}
