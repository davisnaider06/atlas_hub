type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-fg hover:bg-brand-hover",
  secondary:
    "border border-border bg-surface/60 text-text hover:bg-surface-hover hover:border-border-strong",
  ghost: "text-muted hover:bg-surface-hover hover:text-text",
  danger: "bg-danger-subtle text-danger hover:brightness-110",
};

export function buttonClasses(variant: ButtonVariant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`.trim();
}
