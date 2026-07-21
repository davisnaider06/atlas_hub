"use client";

import { useEffect } from "react";

/**
 * Registra o service worker.
 *
 * Só em produção: em desenvolvimento o SW atrapalha o hot reload, servindo
 * versões antigas e mascarando alterações recém-salvas.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // sem SW o app continua funcionando normalmente — só perde o modo offline
    });
  }, []);

  return null;
}
