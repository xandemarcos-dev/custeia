import { describe, it, expect } from "vitest";
import { computeProductionNeeds } from "./productionMath";

describe("computeProductionNeeds — consolida ingredientes por lote", () => {
  it("multiplica pelas N porções e mantém um insumo por linha", () => {
    const r = computeProductionNeeds(
      [
        { ingredientId: "leite", qtyInBase: 395 },
        { ingredientId: "manteiga", qtyInBase: 20 },
      ],
      3
    );
    expect(r.get("leite")).toBe(1185);
    expect(r.get("manteiga")).toBe(60);
    expect(r.size).toBe(2);
  });

  it("soma o MESMO insumo quando aparece em vários grupos (caso La Petite)", () => {
    const r = computeProductionNeeds(
      [
        { ingredientId: "chocolate", qtyInBase: 30 }, // grupo Massa
        { ingredientId: "leite", qtyInBase: 395 },
        { ingredientId: "chocolate", qtyInBase: 120 }, // grupo Cobertura
      ],
      2
    );
    expect(r.get("chocolate")).toBe(300); // (30 + 120) × 2
    expect(r.get("leite")).toBe(790);
    expect(r.size).toBe(2);
  });
});
