import { describe, it, expect } from "vitest";
import { dimensionOf, dimensionLabel } from "./dimension";

describe("dimensionOf", () => {
  it("classifica massa", () => {
    expect(dimensionOf("gr")).toBe("massa");
    expect(dimensionOf("g")).toBe("massa");
    expect(dimensionOf("GRAMA")).toBe("massa");
    expect(dimensionOf("  gramas ")).toBe("massa");
  });

  it("classifica volume", () => {
    expect(dimensionOf("ml")).toBe("volume");
    expect(dimensionOf("L")).toBe("volume");
    expect(dimensionOf("litro")).toBe("volume");
  });

  it("classifica contagem", () => {
    expect(dimensionOf("un")).toBe("contagem");
    expect(dimensionOf("unidade")).toBe("contagem");
    expect(dimensionOf("dúzia")).toBe("contagem");
  });

  it("desconhecido cai em contagem (não converte com nada)", () => {
    expect(dimensionOf("xyz")).toBe("contagem");
  });
});

describe("compatibilidade de dimensão (R6)", () => {
  it("kg e caixa(gr) são ambos massa — compatíveis", () => {
    expect(dimensionOf("gr")).toBe(dimensionOf("gr"));
  });

  it("massa e volume são incompatíveis", () => {
    expect(dimensionOf("gr")).not.toBe(dimensionOf("ml"));
  });
});

describe("dimensionLabel", () => {
  it("retorna rótulos amigáveis", () => {
    expect(dimensionLabel("massa")).toBe("Massa");
    expect(dimensionLabel("volume")).toBe("Volume");
    expect(dimensionLabel("contagem")).toBe("Contagem");
  });
});
