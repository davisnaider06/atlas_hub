type CardProps = {
  className?: string;
  /** usado pra escalonar a animação de entrada (animationDelay) */
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/** Painel de vidro — base de todos os blocos do painel. */
export function Card({ className = "", style, children }: CardProps) {
  return (
    <div className={`glass-panel rounded-2xl ${className}`} style={style}>
      {children}
    </div>
  );
}

/** Rótulo pequeno + título, o cabeçalho padrão dos cards da referência. */
export function CardHeading({
  label,
  title,
  action,
}: {
  label?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {label ? <p className="text-xs text-subtle">{label}</p> : null}
        <h2 className="truncate text-base font-semibold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Chip de variação (verde pra alta, vermelho pra queda). */
export function DeltaChip({ value }: { value: number }) {
  const positivo = value >= 0;
  return (
    <span
      className={
        positivo
          ? "inline-flex items-center gap-1 rounded-full bg-success-subtle px-2 py-0.5 text-xs font-medium text-success"
          : "inline-flex items-center gap-1 rounded-full bg-danger-subtle px-2 py-0.5 text-xs font-medium text-danger"
      }
    >
      <span aria-hidden="true">{positivo ? "▲" : "▼"}</span>
      {positivo ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}
