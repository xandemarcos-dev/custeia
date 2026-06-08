import Image from "next/image";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#182131] px-6">
      <Image src="/batchflow-logo.png" alt="BatchFlow" width={96} height={96} priority />
      <SignIn />
    </main>
  );
}
