"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  compra: "Compra registrada com sucesso.",
  insumo: "Insumo cadastrado com sucesso.",
  producao: "Produção registrada com sucesso.",
  categoria: "Categoria adicionada com sucesso.",
};

export function SuccessToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const ok = params.get("ok");

  useEffect(() => {
    if (!ok) return;
    const msg = MESSAGES[ok] ?? "Operação realizada com sucesso.";
    toast.success(msg);
    // Clean the ?ok= param from the URL without a re-render, preserving other params
    const next = new URLSearchParams(params.toString());
    next.delete("ok");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [ok, pathname, router]);

  return null;
}
