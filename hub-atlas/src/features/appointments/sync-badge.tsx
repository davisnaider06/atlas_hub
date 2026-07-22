"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retrySync } from "./actions";

/**
 * Avisa que o agendamento não chegou ao Google e permite reenviar.
 *
 * A sincronização falha em silêncio de propósito — perder a reunião no Hub
 * porque o Google oscilou seria pior. Mas sem este aviso a pessoa acreditaria
 * que o cliente foi convidado quando não foi.
 */
export function SyncBadge({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [enviando, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function reenviar() {
    setErro(null);
    startTransition(async () => {
      const r = await retrySync(appointmentId);
      if (r.ok) router.refresh();
      else setErro(r.motivo ?? "Não foi possível sincronizar");
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-warning/40 bg-warning-subtle/40 p-3">
      <p className="text-xs leading-relaxed text-muted">
        <span className="font-medium text-warning">Não está no Google Calendar.</span>{" "}
        Este agendamento existe apenas no Hub — o cliente <strong>não</strong> recebeu
        convite.
      </p>
      {erro && <p className="mt-1.5 text-xs text-danger">{erro}</p>}
      <button
        type="button"
        onClick={reenviar}
        disabled={enviando}
        className="mt-2.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-text disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Enviar para o Google"}
      </button>
    </div>
  );
}
