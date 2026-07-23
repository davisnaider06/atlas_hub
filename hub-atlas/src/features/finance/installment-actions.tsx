"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markInstallmentPaid, markInstallmentPending } from "./actions";

/** Botão que dá baixa (marca pago) ou reabre uma parcela. */
export function InstallmentToggle({
  id,
  pago,
}: {
  id: string;
  pago: boolean;
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();

  function alternar() {
    startTransition(async () => {
      if (pago) await markInstallmentPending(id);
      else await markInstallmentPaid(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pendente}
      className={
        pago
          ? "shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:bg-surface-hover disabled:opacity-50"
          : "shrink-0 rounded-lg bg-success-subtle px-2.5 py-1 text-xs font-medium text-success transition-colors hover:brightness-105 disabled:opacity-50"
      }
    >
      {pendente ? "…" : pago ? "Reabrir" : "Dar baixa"}
    </button>
  );
}
