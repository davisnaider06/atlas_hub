"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncFromGoogle } from "./actions";

/**
 * Puxa as novidades do Google ao abrir a tela.
 *
 * Fica num componente cliente (e não no server component da página) de
 * propósito: sincronizar é um efeito colateral, e disparar isso durante o
 * render faria a página escrever no banco a cada re-render.
 */
export function SyncOnOpen({ conectado }: { conectado: boolean }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const jaRodou = useRef(false);

  useEffect(() => {
    if (!conectado || jaRodou.current) return;
    jaRodou.current = true; // StrictMode monta duas vezes em dev

    syncFromGoogle()
      .then((r) => {
        const mudou = r.criados + r.atualizados + r.removidos;
        if (mudou > 0) {
          setMsg(
            `${r.criados} novo(s), ${r.atualizados} atualizado(s), ${r.removidos} removido(s) pelo Google.`,
          );
          startTransition(() => router.refresh());
        }
      })
      .catch(() => {
        // silencioso: a tela continua útil mesmo sem o Google responder
      });
  }, [conectado, router]);

  if (!conectado) return null;

  return (
    <div aria-live="polite" className="min-h-5 text-xs text-subtle">
      {pendente ? "Atualizando…" : msg}
    </div>
  );
}
