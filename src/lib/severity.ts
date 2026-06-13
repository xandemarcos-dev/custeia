// Severidade de margem — fonte única usada na Visão geral, Margem e Produtos.
// marginGap = marginPct − targetMarginPct (negativo = abaixo da meta).
export type Severity = "red" | "amber" | "green";

export function marginSeverity(marginPct: number, marginGap: number): Severity {
  if (marginPct < 0) return "red"; // vende no prejuízo
  if (marginGap >= -5) return "green"; // na meta ou a até 5 p.p. dela
  return "amber"; // abaixo da meta, mas com margem positiva
}

export const severityBadge: Record<Severity, string> = {
  red: "bg-[#fdecee] text-[#c8323c]",
  amber: "bg-[#fbf2e3] text-[#b3741a]",
  green: "bg-[#e7f6ee] text-[#1f9d6b]",
};

export const severityBar: Record<Severity, string> = {
  red: "bg-[#d23c47]",
  amber: "bg-[#e0a33e]",
  green: "bg-[#1f9d6b]",
};

export const severityText: Record<Severity, string> = {
  red: "text-[#c8323c]",
  amber: "text-[#b3741a]",
  green: "text-[#1f9d6b]",
};
