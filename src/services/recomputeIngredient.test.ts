import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do módulo Prisma antes de importar o service
vi.mock("@/lib/prisma", () => ({
  prisma: {
    ingredientEntry: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    ingredientExit: {
      findMany: vi.fn(),
    },
    ingredient: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import { recomputeIngredient } from "./recomputeIngredient";

// Helpers para criar mocks tipados sem ruído de cast
const mockEntries = prisma.ingredientEntry.findMany as ReturnType<typeof vi.fn>;
const mockExits = prisma.ingredientExit.findMany as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  // Por padrão, $transaction executa os itens recebidos (array de promises já resolvidas)
  mockTransaction.mockImplementation(async (ops: unknown[]) => ops);
  prisma.ingredientEntry.update = vi.fn().mockResolvedValue({});
  prisma.ingredient.update = vi.fn().mockResolvedValue({});
});

describe("recomputeIngredient — recalcula estoque e custo médio", () => {
  it("caso básico: 2 entradas, 0 saídas → stockQty = soma das entradas", async () => {
    mockEntries.mockResolvedValue([
      { id: "e1", qtyInBase: "1000", totalCost: "20.00" },
      { id: "e2", qtyInBase: "1000", totalCost: "40.00" },
    ]);
    mockExits.mockResolvedValue([]);

    await recomputeIngredient("ws1", "ing1");

    // Verifica que ingredient.update foi chamado com o estoque correto (2000 − 0)
    const ingredientUpdateCall = (prisma.ingredient.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(ingredientUpdateCall.data.stockQty).toBe(2000);
    // avgCost = (20 + 40) / 2000 = 0,03
    expect(ingredientUpdateCall.data.avgCost).toBeCloseTo(0.03, 6);
  });

  it("caso com saídas: 2 entradas, 1 saída de 500 → stockQty = 2000 − 500 = 1500", async () => {
    mockEntries.mockResolvedValue([
      { id: "e1", qtyInBase: "1000", totalCost: "20.00" },
      { id: "e2", qtyInBase: "1000", totalCost: "40.00" },
    ]);
    mockExits.mockResolvedValue([{ qtyInBase: "500" }]);

    await recomputeIngredient("ws1", "ing1");

    const ingredientUpdateCall = (prisma.ingredient.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(ingredientUpdateCall.data.stockQty).toBe(1500);
    // avgCost não muda com saídas
    expect(ingredientUpdateCall.data.avgCost).toBeCloseTo(0.03, 6);
  });

  it("caso edge: sem entradas, com saída → stockQty = 0 − saída (negativo)", async () => {
    // Quando a única compra é excluída mas a produção já saiu, o estoque fica negativo.
    // Isso é um estado de inconsistência que o sistema registra fielmente; não silencia o valor.
    mockEntries.mockResolvedValue([]);
    mockExits.mockResolvedValue([{ qtyInBase: "200" }]);

    await recomputeIngredient("ws1", "ing1");

    const ingredientUpdateCall = (prisma.ingredient.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(ingredientUpdateCall.data.stockQty).toBe(-200);
    expect(ingredientUpdateCall.data.avgCost).toBe(0);
  });

  it("filtra entradas e saídas pelo workspaceId correto", async () => {
    mockEntries.mockResolvedValue([]);
    mockExits.mockResolvedValue([]);

    await recomputeIngredient("ws-alvo", "ing1");

    expect(mockEntries).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ workspaceId: "ws-alvo" }) })
    );
    expect(mockExits).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ workspaceId: "ws-alvo" }) })
    );
  });
});
