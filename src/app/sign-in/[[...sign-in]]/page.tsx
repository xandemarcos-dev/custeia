import { SignIn } from "@clerk/nextjs";
import { BrandMark } from "@/components/BrandMark";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#182131] px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandMark />
        <div>
          <p className="text-3xl font-extrabold tracking-tight text-white">
            Batch<span className="text-[#2dd4bf]">Flow</span>
          </p>
          <p className="mt-1 text-sm font-medium text-white/60">custo sob controle</p>
        </div>
      </div>
      <SignIn appearance={{ variables: { colorPrimary: "#0f9b8e", borderRadius: "0.625rem" } }} />
    </main>
  );
}
