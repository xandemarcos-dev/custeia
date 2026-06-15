/**
 * Reconstrói os grupos da ficha técnica (ex.: "Massa", "Cobertura") a partir do
 * FormData enviado pelo formulário de produto.
 *
 * O formulário (componente IngredientGroups) emite, em ordem de documento:
 *   - um campo `groupName` por grupo (na ordem dos grupos);
 *   - por linha de insumo: `ingredientGroup` (índice do grupo), `ingredientId` e `qtyInBase`.
 *
 * Como `FormData.getAll` preserva a ordem do DOM, o i-ésimo `ingredientId`
 * casa com o i-ésimo `qtyInBase` e o i-ésimo `ingredientGroup`. Linhas inválidas
 * (sem insumo ou com quantidade <= 0) e grupos sem nenhuma linha válida são descartados.
 */
export type ParsedRecipeGroup = {
  name: string;
  items: { ingredientId: string; qtyInBase: number }[];
};

export function parseRecipeGroupsFromForm(formData: FormData): ParsedRecipeGroup[] {
  const groupNames = formData.getAll("groupName").map((v) => String(v));
  const ingredientIds = formData.getAll("ingredientId").map((v) => String(v));
  const qtys = formData.getAll("qtyInBase").map((v) => Number(v));
  const rowGroupIdx = formData.getAll("ingredientGroup").map((v) => Number(v));

  const itemsByGroup = new Map<number, { ingredientId: string; qtyInBase: number }[]>();
  for (let i = 0; i < ingredientIds.length; i++) {
    const gi = rowGroupIdx[i];
    const id = ingredientIds[i];
    const qty = qtys[i];
    if (!Number.isInteger(gi)) continue;
    if (!id || !(qty > 0)) continue;
    if (!itemsByGroup.has(gi)) itemsByGroup.set(gi, []);
    itemsByGroup.get(gi)!.push({ ingredientId: id, qtyInBase: qty });
  }

  const groups: ParsedRecipeGroup[] = [];
  for (let gi = 0; gi < groupNames.length; gi++) {
    const items = itemsByGroup.get(gi) ?? [];
    if (items.length === 0) continue; // grupo sem insumo válido é ignorado
    const name = groupNames[gi].trim() || (gi === 0 ? "Massa" : `Grupo ${gi + 1}`);
    groups.push({ name, items });
  }
  return groups;
}
