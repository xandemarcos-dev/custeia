// Cor de chip determinística por nome de categoria (categorias são livres,
// então derivamos a cor do nome — mesma categoria, sempre a mesma cor).
const palette = [
  "bg-[#e6faf6] text-[#0f766e]", // teal
  "bg-[#eef2ff] text-[#4f46e5]", // indigo
  "bg-[#fff1f2] text-[#be123c]", // rosa
  "bg-[#fef3c7] text-[#92660e]", // âmbar
  "bg-[#ecfdf5] text-[#047857]", // verde
  "bg-[#eff6ff] text-[#1d4ed8]", // azul
  "bg-[#faf5ff] text-[#7e22ce]", // violeta
  "bg-[#f1f5f9] text-[#475569]", // slate
];

export function categoryChip(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}
