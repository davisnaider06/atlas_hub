"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCalendar } from "./actions";

type Opcao = { id: string; nome: string; principal: boolean };

/**
 * Escolhe qual agenda do Google o Hub sincroniza.
 *
 * Existe porque adivinhar pelo nome é frágil: uma agenda criada à mão como
 * "ATLAS - AGENDAMENTOS" não casava com o nome esperado e o Hub acabava
 * observando outra agenda, vazia.
 */
export function CalendarSelect({
  agendas,
  atual,
}: {
  agendas: Opcao[];
  atual: string | null;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(atual ?? "");
  const [salvando, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function aoMudar(novo: string) {
    const anterior = valor;
    setValor(novo);
    setMsg(null);

    startTransition(async () => {
      try {
        await setCalendar(novo);
        setMsg("Agenda alterada. Abra Agendamentos para sincronizar.");
        router.refresh();
      } catch (e) {
        setValor(anterior);
        setMsg(e instanceof Error ? e.message : "Não foi possível salvar");
      }
    });
  }

  if (agendas.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-border p-3">
      <label htmlFor="calendarId" className="mb-1.5 block text-sm font-medium">
        Agenda sincronizada
      </label>
      <select
        id="calendarId"
        value={valor}
        disabled={salvando}
        onChange={(e) => aoMudar(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-sunken/60 px-3 py-2 text-sm disabled:opacity-50"
      >
        <option value="" disabled>
          Selecione uma agenda
        </option>
        {agendas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nome}
            {a.principal ? " (principal)" : ""}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-xs text-subtle">
        {salvando
          ? "salvando…"
          : (msg ??
            "Só os eventos desta agenda aparecem no Hub. Evite a agenda principal para não trazer compromissos pessoais.")}
      </p>
    </div>
  );
}
