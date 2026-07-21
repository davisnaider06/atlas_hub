"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PAPEIS_ATRIBUIVEIS, ROTULO_PAPEL } from "@/features/auth/permissions";
import { updateMemberRole } from "./actions";
import type { Role } from "@/generated/prisma/enums";

/**
 * Seletor de papel que salva ao mudar, sem botão.
 *
 * Mantém o valor em estado (controlado) e chama `router.refresh()` depois de
 * salvar: sem isso, a tela continuava exibindo o dado antigo até o usuário sair
 * e voltar, dando a impressão de que não tinha salvado.
 */
export function RoleSelect({
  userId,
  papelAtual,
  desabilitado,
  titulo,
}: {
  userId: string;
  papelAtual: Role;
  desabilitado?: boolean;
  titulo?: string;
}) {
  const router = useRouter();
  const [papel, setPapel] = useState<Role>(papelAtual);
  const [salvando, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function aoMudar(novo: Role) {
    const anterior = papel;
    setPapel(novo); // otimista: a UI responde na hora
    setErro(null);

    startTransition(async () => {
      try {
        await updateMemberRole(userId, novo);
        router.refresh();
      } catch (e) {
        setPapel(anterior); // desfaz se o servidor recusou
        setErro(e instanceof Error ? e.message : "Não foi possível salvar");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <select
          value={papel}
          disabled={desabilitado || salvando}
          title={titulo}
          onChange={(e) => aoMudar(e.target.value as Role)}
          aria-label="Papel da pessoa"
          className="rounded-lg border border-border bg-surface-sunken/60 px-2.5 py-1.5 text-xs transition-opacity disabled:opacity-50"
        >
          {PAPEIS_ATRIBUIVEIS.map((p) => (
            <option key={p} value={p}>
              {ROTULO_PAPEL[p]}
            </option>
          ))}
        </select>
        {salvando && (
          <span className="text-xs text-subtle" aria-live="polite">
            salvando…
          </span>
        )}
      </div>
      {erro && <span className="text-xs text-danger">{erro}</span>}
    </div>
  );
}
