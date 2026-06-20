import ExcelJS from "exceljs";
import path from "path";

interface Ingrediente {
  codigo: number;
  qtd: number;
}

interface FichaTecnica {
  nome: string;
  yieldQty: number;
  unitPrice: number;
  packagingCost: number;
  ingredientes: Ingrediente[];
}

async function extractFichaTecnica(): Promise<void> {
  const ftPath = path.join(__dirname, "..", "..", "FT.xlsx");
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(ftPath);

  // Encontrar aba do produto (código 7 ou nome "Tradicional ao Leite")
  const sheet = workbook.getWorksheet("7 - Tradicional ao Leite");

  if (!sheet) {
    console.error("Aba '7 - Tradicional ao Leite' não encontrada");
    process.exit(1);
  }

  // Extrair dados
  const nome = sheet.getCell("A1").value as string; // "Receita: Tradicional ao Leite"
  const yieldQtyValue = sheet.getCell("L3").value;
  const yieldQty = typeof yieldQtyValue === "string" ? parseInt(yieldQtyValue, 10) : (yieldQtyValue as number); // Converter para número
  const unitPrice = sheet.getCell("L19").value as number; // 2

  // L8 contém fórmula =(L3/100)*EMBALAGEM_BASE, calcular manualmente
  const l3Value = sheet.getCell("L3").value as number;
  const EMBALAGEM_BASE = 16; // Custo padrão de embalagem em centavos
  const packagingCost = (l3Value / 100) * EMBALAGEM_BASE;

  // Extrair ingredientes do bloco 1 (Massa): linhas 8-11, coluna A (código) e D (quantidade)
  const ingredientes: Ingrediente[] = [];

  // Bloco 1: Massa (linhas 8-11)
  for (let row = 8; row <= 11; row++) {
    const codigoCell = sheet.getCell(`A${row}`).value;
    const qtdCell = sheet.getCell(`D${row}`).value;

    if (codigoCell !== null && codigoCell !== undefined) {
      ingredientes.push({
        codigo: codigoCell as number,
        qtd: (qtdCell as number) || 0,
      });
    }
  }

  // Bloco 2: Cobertura/Confeitos (linhas 23+)
  for (let row = 23; row <= 32; row++) {
    const codigoCell = sheet.getCell(`A${row}`).value;
    const qtdCell = sheet.getCell(`D${row}`).value;

    if (codigoCell !== null && codigoCell !== undefined) {
      ingredientes.push({
        codigo: codigoCell as number,
        qtd: (qtdCell as number) || 0,
      });
    }
  }

  const fichaTecnica: FichaTecnica = {
    nome,
    yieldQty,
    unitPrice,
    packagingCost,
    ingredientes,
  };

  // Output
  console.log("\n=== FICHA TÉCNICA: 7 - Tradicional ao Leite ===");
  console.log(`Nome: ${fichaTecnica.nome}`);
  console.log(`Rendimento: ${fichaTecnica.yieldQty}`);
  console.log(`Preço Unitário: R$ ${fichaTecnica.unitPrice}`);
  console.log(`Custo Embalagem: R$ ${fichaTecnica.packagingCost}`);
  console.log(`Total de Ingredientes: ${fichaTecnica.ingredientes.length}`);
  console.log("\nIngredientes:");
  fichaTecnica.ingredientes.forEach((ing, idx) => {
    console.log(`  ${idx + 1}. Código ${ing.codigo}: ${ing.qtd} unidades`);
  });
  console.log();

  return;
}

extractFichaTecnica().catch(console.error);
