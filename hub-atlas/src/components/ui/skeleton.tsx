/**
 * Blocos de carregamento. Usados pelos `loading.tsx` pra tela aparecer na hora
 * enquanto o servidor ainda busca os dados (streaming), em vez de a navegação
 * ficar travada esperando o banco.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-hover ${className}`} />;
}

/** Cabeçalho padrão das páginas (título + subtítulo + botão). */
export function SkeletonPageHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-10 w-36 rounded-full" />
    </div>
  );
}
