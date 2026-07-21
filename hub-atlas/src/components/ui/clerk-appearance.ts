/**
 * Tema dos componentes do Clerk (login, cadastro, UserButton).
 *
 * Os valores apontam pros nossos tokens CSS em vez de cores fixas — assim o
 * widget acompanha o toggle de light/dark sozinho, sem precisar de estado.
 *
 * Sem anotação de tipo de propósito: `@clerk/types` não é dependência direta do
 * projeto, e a checagem acontece no ponto de uso (prop `appearance`).
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--brand)",
    colorBackground: "var(--surface-raised)",
    colorText: "var(--text)",
    colorTextSecondary: "var(--text-muted)",
    colorInputBackground: "var(--surface-sunken)",
    colorInputText: "var(--text)",
    colorDanger: "var(--danger)",
    colorSuccess: "var(--success)",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    // o card já vive dentro do nosso painel de vidro, então zeramos o dele
    card: "bg-transparent shadow-none",
    cardBox: "shadow-none border-none bg-transparent",
    headerTitle: "text-text",
    headerSubtitle: "text-muted",
    socialButtonsBlockButton: "border-border hover:bg-surface-hover text-text",
    formFieldInput: "border-border",
    formButtonPrimary:
      "bg-brand hover:bg-brand-hover text-brand-fg normal-case font-semibold",
    footerActionLink: "text-brand hover:text-brand-hover",
    footer: "bg-transparent",
  },
};
