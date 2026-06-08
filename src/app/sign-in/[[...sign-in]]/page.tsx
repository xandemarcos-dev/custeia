import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#182131] px-6">
      <div className="text-center">
        <p className="text-3xl font-semibold tracking-tight text-white">
          Batch<span className="text-[#2bc4b0]">Flow</span>
        </p>
        <p className="mt-1 text-sm text-white/60">custo sob controle</p>
      </div>
      <SignIn />
    </main>
  );
}
