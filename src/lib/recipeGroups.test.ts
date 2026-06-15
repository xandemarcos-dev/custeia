import { describe, it, expect } from "vitest";
import { parseRecipeGroupsFromForm } from "./recipeGroups";

/** Monta um FormData imitando o componente IngredientGroups. */
function buildForm(
  groups: { name: string; rows: { ingredientId: string; qty: string }[] }[]
): FormData {
  const fd = new FormData();
  groups.forEach((g, gi) => {
    fd.append("groupName", g.name);
    g.rows.forEach((r) => {
      fd.append("ingredientGroup", String(gi));
      fd.append("ingredientId", r.ingredientId);
      fd.append("qtyInBase", r.qty);
    });
  });
  return fd;
}

describe("parseRecipeGroupsFromForm", () => {
  it("monta um único grupo com seus insumos", () => {
    const fd = buildForm([
      { name: "Massa", rows: [{ ingredientId: "a", qty: "100" }, { ingredientId: "b", qty: "50" }] },
    ]);
    expect(parseRecipeGroupsFromForm(fd)).toEqual([
      { name: "Massa", items: [{ ingredientId: "a", qtyInBase: 100 }, { ingredientId: "b", qtyInBase: 50 }] },
    ]);
  });

  it("preserva a ordem e separa dois grupos (massa + cobertura)", () => {
    const fd = buildForm([
      { name: "Massa", rows: [{ ingredientId: "a", qty: "100" }] },
      { name: "Cobertura", rows: [{ ingredientId: "c", qty: "30" }, { ingredientId: "d", qty: "10" }] },
    ]);
    expect(parseRecipeGroupsFromForm(fd)).toEqual([
      { name: "Massa", items: [{ ingredientId: "a", qtyInBase: 100 }] },
      { name: "Cobertura", items: [{ ingredientId: "c", qtyInBase: 30 }, { ingredientId: "d", qtyInBase: 10 }] },
    ]);
  });

  it("descarta linhas sem insumo ou com quantidade <= 0", () => {
    const fd = buildForm([
      {
        name: "Massa",
        rows: [
          { ingredientId: "a", qty: "100" },
          { ingredientId: "", qty: "50" }, // sem insumo
          { ingredientId: "b", qty: "0" }, // qty zero
        ],
      },
    ]);
    expect(parseRecipeGroupsFromForm(fd)).toEqual([
      { name: "Massa", items: [{ ingredientId: "a", qtyInBase: 100 }] },
    ]);
  });

  it("descarta grupos que ficaram sem nenhum insumo válido", () => {
    const fd = buildForm([
      { name: "Massa", rows: [{ ingredientId: "a", qty: "100" }] },
      { name: "Vazio", rows: [{ ingredientId: "", qty: "0" }] },
    ]);
    expect(parseRecipeGroupsFromForm(fd)).toEqual([
      { name: "Massa", items: [{ ingredientId: "a", qtyInBase: 100 }] },
    ]);
  });

  it("usa nome padrão quando o grupo vem sem nome", () => {
    const fd = buildForm([
      { name: "  ", rows: [{ ingredientId: "a", qty: "100" }] },
      { name: "", rows: [{ ingredientId: "b", qty: "20" }] },
    ]);
    expect(parseRecipeGroupsFromForm(fd)).toEqual([
      { name: "Massa", items: [{ ingredientId: "a", qtyInBase: 100 }] },
      { name: "Grupo 2", items: [{ ingredientId: "b", qtyInBase: 20 }] },
    ]);
  });

  it("retorna vazio quando não há insumo nenhum", () => {
    const fd = buildForm([{ name: "Massa", rows: [] }]);
    expect(parseRecipeGroupsFromForm(fd)).toEqual([]);
  });
});
