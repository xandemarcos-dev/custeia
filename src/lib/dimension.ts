/**
 * Dimensão (grandeza) de uma unidade de medida.
 * No RIXAN, toda unidade pertence a uma dimensão e converte para a base
 * canônica dela: massa→g, volume→ml, contagem→un.
 *
 * Enquanto o schema usa `baseUnit` como string, derivamos a dimensão dela.
 * Isso permite impedir misturas inválidas (ex: comprar em litros um insumo
 * medido em gramas) sem precisar de migração.
 */
export type Dimension = "massa" | "volume" | "contagem";

const MASSA = ["g", "gr", "grama", "gramas"];
const VOLUME = ["ml", "mililitro", "mililitros", "l", "litro", "litros"];
const CONTAGEM = ["un", "und", "unid", "unidade", "unidades", "dz", "duzia", "dúzia"];

/** Deriva a dimensão a partir do símbolo da unidade base (gr/ml/un). */
export function dimensionOf(baseUnit: string): Dimension {
  const b = baseUnit.trim().toLowerCase();
  if (MASSA.includes(b)) return "massa";
  if (VOLUME.includes(b)) return "volume";
  if (CONTAGEM.includes(b)) return "contagem";
  // Fallback seguro: trata desconhecido como contagem (não converte com nada).
  return "contagem";
}

/** Rótulo amigável para exibição na UI. */
export function dimensionLabel(d: Dimension): string {
  switch (d) {
    case "massa": return "Massa";
    case "volume": return "Volume";
    case "contagem": return "Contagem";
  }
}
