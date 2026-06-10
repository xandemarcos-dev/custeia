import { SignOutButton } from "@clerk/nextjs";

export default function SemAcessoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Acesso não autorizado</h1>
      <p className="text-muted-foreground">
        Sua conta não tem acesso a este espaço de trabalho. Fale com o administrador
        para ser liberado.
      </p>
      <SignOutButton>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Sair
        </button>
      </SignOutButton>
    </main>
  );
}
