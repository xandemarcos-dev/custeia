"use client";

import { useEffect, useState } from "react";
import { Calculator, X } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (n: number) => {
  if (!Number.isFinite(n)) return "Erro";
  // Evita notação científica e limita casas, mantendo precisão visual razoável.
  const rounded = Math.round((n + Number.EPSILON) * 1e10) / 1e10;
  return rounded.toLocaleString("pt-BR", { maximumFractionDigits: 10 });
};

type Op = "+" | "-" | "×" | "÷";

function calc(a: number, b: number, op: Op): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
  }
}

export function CalculatorFab() {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  const [freshEntry, setFreshEntry] = useState(true);

  const clearAll = () => {
    setDisplay("0");
    setAcc(null);
    setPendingOp(null);
    setFreshEntry(true);
  };

  const inputDigit = (d: string) => {
    setDisplay((cur) => {
      if (freshEntry) {
        setFreshEntry(false);
        return d;
      }
      if (cur === "0") return d;
      if (cur.replace(/[^0-9]/g, "").length >= 15) return cur; // limite de dígitos
      return cur + d;
    });
  };

  const inputDot = () => {
    setDisplay((cur) => {
      if (freshEntry) {
        setFreshEntry(false);
        return "0,";
      }
      return cur.includes(",") ? cur : cur + ",";
    });
  };

  const toNumber = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

  const applyOp = (op: Op) => {
    const current = toNumber(display);
    if (acc === null) {
      setAcc(current);
    } else if (pendingOp && !freshEntry) {
      const result = calc(acc, current, pendingOp);
      setAcc(result);
      setDisplay(fmt(result));
    }
    setPendingOp(op);
    setFreshEntry(true);
  };

  const equals = () => {
    if (pendingOp === null || acc === null) return;
    const current = toNumber(display);
    const result = calc(acc, current, pendingOp);
    setDisplay(fmt(result));
    setAcc(null);
    setPendingOp(null);
    setFreshEntry(true);
  };

  const toggleSign = () => {
    setDisplay((cur) => (cur.startsWith("-") ? cur.slice(1) : cur === "0" ? cur : "-" + cur));
  };

  const percent = () => {
    setDisplay((cur) => fmt(toNumber(cur) / 100));
    setFreshEntry(true);
  };

  const backspace = () => {
    setDisplay((cur) => {
      if (freshEntry) return cur;
      if (cur.length <= 1 || (cur.length === 2 && cur.startsWith("-"))) {
        setFreshEntry(true);
        return "0";
      }
      return cur.slice(0, -1);
    });
  };

  // Suporte a teclado quando o painel está aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k >= "0" && k <= "9") inputDigit(k);
      else if (k === ".") inputDot();
      else if (k === "," ) inputDot();
      else if (k === "+") applyOp("+");
      else if (k === "-") applyOp("-");
      else if (k === "*") applyOp("×");
      else if (k === "/") { e.preventDefault(); applyOp("÷"); }
      else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
      else if (k === "Backspace") backspace();
      else if (k === "Escape") clearAll();
      else if (k === "%") percent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, display, acc, pendingOp, freshEntry]);

  const Btn = ({
    label,
    onClick,
    variant = "num",
    wide = false,
  }: {
    label: React.ReactNode;
    onClick: () => void;
    variant?: "num" | "op" | "fn" | "eq";
    wide?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center rounded-lg text-base font-medium transition-colors select-none active:translate-y-px",
        wide && "col-span-2",
        variant === "num" && "bg-muted hover:bg-muted/70 text-foreground",
        variant === "fn" && "bg-secondary hover:bg-secondary/70 text-secondary-foreground",
        variant === "op" && "bg-primary/10 text-primary hover:bg-primary/20",
        variant === "eq" && "bg-primary text-primary-foreground hover:bg-primary/80"
      )}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Botão flutuante */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fechar calculadora" : "Abrir calculadora"}
        className="fixed bottom-6 right-6 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : <Calculator className="size-6" />}
      </button>

      {/* Painel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-72 rounded-2xl border bg-background p-4 shadow-2xl">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Calculadora</p>

          <div className="mb-3 rounded-lg bg-muted/50 px-3 py-3 text-right">
            <div className="h-4 text-xs text-muted-foreground">
              {acc !== null && pendingOp ? `${fmt(acc)} ${pendingOp}` : " "}
            </div>
            <div className="overflow-x-auto text-2xl font-semibold tabular-nums" title={display}>
              {display}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Btn label="C" onClick={clearAll} variant="fn" />
            <Btn label="±" onClick={toggleSign} variant="fn" />
            <Btn label="%" onClick={percent} variant="fn" />
            <Btn label="÷" onClick={() => applyOp("÷")} variant="op" />

            <Btn label="7" onClick={() => inputDigit("7")} />
            <Btn label="8" onClick={() => inputDigit("8")} />
            <Btn label="9" onClick={() => inputDigit("9")} />
            <Btn label="×" onClick={() => applyOp("×")} variant="op" />

            <Btn label="4" onClick={() => inputDigit("4")} />
            <Btn label="5" onClick={() => inputDigit("5")} />
            <Btn label="6" onClick={() => inputDigit("6")} />
            <Btn label="-" onClick={() => applyOp("-")} variant="op" />

            <Btn label="1" onClick={() => inputDigit("1")} />
            <Btn label="2" onClick={() => inputDigit("2")} />
            <Btn label="3" onClick={() => inputDigit("3")} />
            <Btn label="+" onClick={() => applyOp("+")} variant="op" />

            <Btn label="0" onClick={() => inputDigit("0")} wide />
            <Btn label="," onClick={inputDot} />
            <Btn label="=" onClick={equals} variant="eq" />
          </div>
        </div>
      )}
    </>
  );
}
