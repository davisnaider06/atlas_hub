"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/field";
import { centavosParaInput } from "@/features/crm/money";
import { setSalesGoal } from "./actions";

/** Edita a meta e a comissão de um SDR, num popover simples inline. */
export function GoalEditor({
  userId,
  targetCents,
  commissionPercent,
}: {
  userId: string;
  targetCents: number;
  commissionPercent: number | null;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function salvar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      try {
        await setSalesGoal(userId, fd);
        setAberto(false);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar");
      }
    });
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-xs text-muted underline-offset-2 hover:text-brand hover:underline"
      >
        Editar meta
      </button>
    );
  }

  return (
    <form action={salvar} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-[0.65rem] text-subtle">Meta (R$)</label>
        <input
          name="target"
          inputMode="decimal"
          defaultValue={centavosParaInput(targetCents)}
          className={`${fieldClasses} h-8 w-28 py-1 text-xs`}
        />
      </div>
      <div>
        <label className="mb-1 block text-[0.65rem] text-subtle">Comissão %</label>
        <input
          name="commission"
          inputMode="decimal"
          defaultValue={commissionPercent ?? ""}
          placeholder="—"
          className={`${fieldClasses} h-8 w-20 py-1 text-xs`}
        />
      </div>
      <button
        type="submit"
        disabled={salvando}
        className={buttonClasses("primary", "h-8 px-3 py-1 text-xs disabled:opacity-60")}
      >
        {salvando ? "…" : "Salvar"}
      </button>
      <button
        type="button"
        onClick={() => setAberto(false)}
        className="h-8 px-2 text-xs text-muted hover:text-text"
      >
        Cancelar
      </button>
      {erro && <span className="w-full text-xs text-danger">{erro}</span>}
    </form>
  );
}
