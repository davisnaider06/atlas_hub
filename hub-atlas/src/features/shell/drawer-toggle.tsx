"use client";

import { IconMenu } from "@/components/ui/icons";

/**
 * Abre a gaveta do menu no mobile, escrevendo data-drawer no <html> — mesmo
 * padrão do toggle de tema. O sidebar reage por CSS, sem estado compartilhado.
 */
export function DrawerToggle() {
  return (
    <button
      type="button"
      onClick={() => document.documentElement.setAttribute("data-drawer", "open")}
      aria-label="Abrir menu"
      className="grid size-9 place-items-center rounded-md border border-border text-muted transition-colors hover:bg-surface-hover hover:text-text lg:hidden"
    >
      <IconMenu className="size-5" />
    </button>
  );
}
