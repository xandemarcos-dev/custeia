/** Formata um número como Real brasileiro, com casas decimais flexíveis. */
export function formatBRL(value: number, maxFractionDigits = 4): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}
