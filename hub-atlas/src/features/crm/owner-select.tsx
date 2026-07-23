"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reassignOwner } from "./actions";

type Opcao = { id: string; name: string | null; email: string };

/** Troca o SDR responsável pelo lead — salva na hora, sem botão. */
export function OwnerSelect({
  contactId,
  ownerId,
  sdrs,
}: {
  contactId: string;
  ownerId: string | null;
  sdrs: Opcao[];
}) {
  const router = useRouter();
  const [valor, setValor] = useState(ownerId ?? "");
  const [salvando, startTransition] = useTransition();

  function aoMudar(novo: string) {
    const anterior = valor;
    setValor(novo);
    startTransition(async () => {
      try {
        await reassignOwner(contactId, novo);
        router.refresh();
      } catch {
        setValor(anterior);
      }
    });
  }

  return (
    <label className="flex items-center gap-2 text-xs text-subtle">
      Responsável
      <select
        value={valor}
        disabled={salvando}
        onChange={(e) => aoMudar(e.target.value)}
        className="rounded-lg border border-border bg-surface-sunken/60 px-2.5 py-1.5 text-xs text-text disabled:opacity-50"
      >
        <option value="">Sem responsável</option>
        {sdrs.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name ?? s.email}
          </option>
        ))}
      </select>
    </label>
  );
}
