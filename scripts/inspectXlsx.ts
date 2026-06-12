/* Inspeção rápida da estrutura das planilhas reais (apoio ao importador). */
import ExcelJS from "exceljs";

const file = process.argv[2];
const sheetArg = process.argv[3];
const maxRows = Number(process.argv[4] ?? 15);

async function main() {
  if (!file) {
    console.error("Uso: tsx scripts/inspectXlsx.ts <arquivo> [aba] [maxLinhas]");
    process.exit(1);
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);

  if (!sheetArg) {
    console.log(`Abas de ${file}:`);
    wb.eachSheet((ws) => {
      console.log(`- "${ws.name}" (${ws.rowCount} linhas × ${ws.columnCount} colunas)`);
    });
    return;
  }

  const ws = wb.getWorksheet(sheetArg);
  if (!ws) {
    console.error(`Aba "${sheetArg}" não encontrada.`);
    process.exit(1);
  }
  console.log(`Aba "${ws.name}" — primeiras ${maxRows} linhas:`);
  for (let r = 1; r <= Math.min(maxRows, ws.rowCount); r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      let v: unknown = cell.value;
      if (v && typeof v === "object" && "result" in v) v = (v as { result: unknown }).result;
      if (v && typeof v === "object" && "richText" in v)
        v = (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
      cells.push(`[${col}]${String(v).slice(0, 30)}`);
    });
    console.log(`L${r}: ${cells.join(" | ")}`);
  }
}

main();
