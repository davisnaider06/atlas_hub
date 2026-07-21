"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/field";
import {
  IconContacts,
  IconSchedule,
  IconTrendUp,
} from "@/components/ui/icons";
import { completeTask, createFollowUp } from "./actions";
import type { Routine } from "./queries";

const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

const CHAVE = "rotina-vista-em";

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Abre a rotina do dia no primeiro acesso de cada dia.
 *
 * A marca fica em localStorage por data (não um booleano): assim reabre
 * naturalmente no dia seguinte, sem precisar de limpeza agendada.
 */
export function RoutineModal({ routine, nome }: { routine: Routine; nome: string | null }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // decidido no primeiro render (e não dentro do efeito) pra evitar um render
  // extra e o aviso de setState-in-effect
  const [aberto, setAberto] = useState(() => {
    if (typeof window === "undefined") return false; // SSR: só abre no cliente
    if (routine.total === 0) return false; // sem pendências, não interrompe
    try {
      return localStorage.getItem(CHAVE) !== hojeISO();
    } catch {
      return true; // localStorage bloqueado: mostra mesmo assim
    }
  });

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (aberto && !el.open) el.showModal();
    if (!aberto && el.open) el.close();
  }, [aberto]);

  function fechar() {
    try {
      localStorage.setItem(CHAVE, hojeISO());
    } catch {
      // sem persistência: reabre na próxima navegação, aceitável
    }
    setAberto(false);
  }

  async function concluir(id: string) {
    await completeTask(id);
    router.refresh();
  }

  async function agendarFollowUp(id: string) {
    await createFollowUp(id);
    router.refresh();
  }

  const primeiroNome = nome?.split(" ")[0];

  return (
    <dialog
      ref={dialogRef}
      onClose={fechar}
      onClick={(e) => {
        if (e.target === dialogRef.current) fechar();
      }}
      className="glass-panel m-auto w-[min(94vw,40rem)] rounded-2xl p-0 text-text backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {primeiroNome ? `Bom dia, ${primeiroNome}` : "Sua rotina de hoje"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {routine.total}{" "}
              {routine.total === 1 ? "item precisa" : "itens precisam"} da sua atenção.
            </p>
          </div>
          <Badge tone="brand">{dataCurta.format(new Date())}</Badge>
        </div>

        {/* atrasadas primeiro: são o que mais dói */}
        {routine.atrasadas.length > 0 && (
          <Secao titulo="Atrasadas" tom="danger">
            {routine.atrasadas.map((t) => (
              <Linha
                key={t.id}
                icone={<IconTrendUp className="size-4" />}
                titulo={t.title}
                sub={`Venceu em ${dataCurta.format(t.dueAt)}${
                  t.contact ? ` · ${t.contact.name}` : ""
                }`}
                acao={
                  <button
                    type="button"
                    onClick={() => concluir(t.id)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-text"
                  >
                    Concluir
                  </button>
                }
              />
            ))}
          </Secao>
        )}

        {routine.agendamentosHoje.length > 0 && (
          <Secao titulo="Agenda de hoje">
            {routine.agendamentosHoje.map((a) => (
              <Linha
                key={a.id}
                icone={<IconSchedule className="size-4" />}
                titulo={a.title}
                sub={`${hora.format(a.startsAt)}${a.contact ? ` · ${a.contact.name}` : ""}`}
                acao={
                  <Link
                    href={`/dashboard/appointments/${a.id}`}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-text"
                  >
                    Abrir
                  </Link>
                }
              />
            ))}
          </Secao>
        )}

        {routine.tarefas.length > 0 && (
          <Secao titulo="Tarefas de hoje">
            {routine.tarefas.map((t) => (
              <Linha
                key={t.id}
                icone={<IconTrendUp className="size-4" />}
                titulo={t.title}
                sub={t.contact ? t.contact.name : (t.description ?? "")}
                acao={
                  <button
                    type="button"
                    onClick={() => concluir(t.id)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-text"
                  >
                    Concluir
                  </button>
                }
              />
            ))}
          </Secao>
        )}

        {routine.leadsParados.length > 0 && (
          <Secao titulo="Leads esfriando" tom="warning">
            {routine.leadsParados.map((c) => (
              <Linha
                key={c.id}
                icone={<IconContacts className="size-4" />}
                titulo={c.name}
                sub={`${c.stage.name} · parado desde ${dataCurta.format(c.updatedAt)}`}
                acao={
                  <button
                    type="button"
                    onClick={() => agendarFollowUp(c.id)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-text"
                  >
                    Criar follow-up
                  </button>
                }
              />
            ))}
          </Secao>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={fechar} className={buttonClasses("primary")}>
            Começar o dia
          </button>
          <Link
            href="/dashboard/routine"
            onClick={fechar}
            className={buttonClasses("secondary")}
          >
            Ver rotina completa
          </Link>
        </div>
      </div>
    </dialog>
  );
}

function Secao({
  titulo,
  tom,
  children,
}: {
  titulo: string;
  tom?: "danger" | "warning";
  children: React.ReactNode;
}) {
  const cor =
    tom === "danger" ? "text-danger" : tom === "warning" ? "text-warning" : "text-subtle";
  return (
    <section className="mt-5">
      <h3 className={`mb-2 text-xs font-medium uppercase tracking-wider ${cor}`}>
        {titulo}
      </h3>
      <ul className="space-y-1.5">{children}</ul>
    </section>
  );
}

function Linha({
  icone,
  titulo,
  sub,
  acao,
}: {
  icone: React.ReactNode;
  titulo: string;
  sub?: string;
  acao?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border p-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-sunken text-muted">
        {icone}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{titulo}</p>
        {sub && <p className="truncate text-xs text-subtle">{sub}</p>}
      </div>
      {acao}
    </li>
  );
}
