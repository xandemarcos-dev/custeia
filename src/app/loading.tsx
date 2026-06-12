/* Feedback imediato em qualquer navegação: o clique nunca parece ignorado. */
export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-sm">Carregando…</span>
      </div>
    </div>
  );
}
