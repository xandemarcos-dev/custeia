/* Skeleton da home: a estrutura aparece na hora, o clique nunca parece ignorado. */
function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <Block className="h-8 w-48" />
      <Block className="mt-2 h-4 w-72" />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-24" />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-8 w-full sm:w-32" />
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Block className="h-28" />
        <Block className="h-28" />
      </div>

      <Block className="mt-4 h-56 w-full" />
    </main>
  );
}
