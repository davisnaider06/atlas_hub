/** Classes compartilhadas por input/textarea/select, pra tudo respirar igual. */
export const fieldClasses =
  "w-full rounded-xl border border-border bg-surface-sunken/60 px-3.5 py-2.5 text-sm text-text placeholder:text-subtle transition-colors focus:border-brand-border";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-subtle">{hint}</span> : null}
    </label>
  );
}

/** Etiqueta de estágio/status. */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "success" | "danger";
}) {
  const tones = {
    neutral: "bg-surface-sunken text-muted border-border",
    brand: "bg-brand-subtle text-brand border-brand-border",
    success: "bg-success-subtle text-success border-transparent",
    danger: "bg-danger-subtle text-danger border-transparent",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Estado vazio — evita a tela "morta" quando não há dados. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? (
        <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-surface-sunken text-subtle">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-medium text-text">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
