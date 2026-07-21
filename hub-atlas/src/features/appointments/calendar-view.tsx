"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/field";
import { buttonClasses } from "@/components/ui/button";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@/components/ui/icons";
import { deleteAppointment } from "./actions";
import { agruparPorDia, chaveDoDia, gerarGrade, mesmoDia } from "./calendar-utils";
import type { AppointmentListItem } from "./queries";

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const mesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const horaCurta = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dataExtensa = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const rotuloStatus: Record<string, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

function tomDoStatus(status: string) {
  if (status === "CANCELED") return "danger" as const;
  if (status === "COMPLETED") return "success" as const;
  return "brand" as const;
}

export function CalendarView({ appointments }: { appointments: AppointmentListItem[] }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [selecionado, setSelecionado] = useState<AppointmentListItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // agrupa por dia uma vez só, em vez de filtrar a lista em cada célula
  const porDia = useMemo(() => agruparPorDia(appointments), [appointments]);

  const dias = useMemo(() => gerarGrade(ano, mes), [ano, mes]);

  // <dialog> nativo: ganhamos Esc e travamento de foco de graça
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (selecionado && !el.open) el.showModal();
    if (!selecionado && el.open) el.close();
  }, [selecionado]);

  function irPara(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  }

  function hojeAgora() {
    const d = new Date();
    setAno(d.getFullYear());
    setMes(d.getMonth());
  }

  const titulo = mesAno.format(new Date(ano, mes, 1));

  return (
    <>
      {/* barra de navegação do mês */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold capitalize tracking-tight">{titulo}</h2>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => irPara(-1)}
            aria-label="Mês anterior"
            className="grid size-9 place-items-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <IconChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={hojeAgora}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => irPara(1)}
            aria-label="Próximo mês"
            className="grid size-9 place-items-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <IconChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-t-xl border border-border bg-border">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="bg-surface px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-subtle"
          >
            {d}
          </div>
        ))}
      </div>

      {/* grade do mês */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-xl border border-t-0 border-border bg-border">
        {dias.map((dia) => {
          const doMes = dia.getMonth() === mes;
          const ehHoje = mesmoDia(dia, hoje);
          const eventos = porDia.get(chaveDoDia(dia)) ?? [];

          return (
            <div
              key={dia.toISOString()}
              className={`min-h-24 bg-surface p-1.5 transition-colors ${
                doMes ? "" : "opacity-40"
              }`}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={
                    ehHoje
                      ? "grid size-6 place-items-center rounded-full bg-brand text-xs font-semibold text-brand-fg"
                      : "grid size-6 place-items-center text-xs text-muted"
                  }
                >
                  {dia.getDate()}
                </span>
              </div>

              <div className="space-y-1">
                {eventos.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelecionado(a)}
                    title={`${horaCurta.format(new Date(a.startsAt))} · ${a.title}`}
                    className={`block w-full truncate rounded px-1.5 py-1 text-left text-[0.7rem] transition-opacity hover:opacity-80 ${
                      a.status === "CANCELED"
                        ? "bg-danger-subtle text-danger line-through"
                        : a.status === "COMPLETED"
                          ? "bg-success-subtle text-success"
                          : "bg-brand-subtle text-brand"
                    }`}
                  >
                    <span className="tabular-nums opacity-80">
                      {horaCurta.format(new Date(a.startsAt))}
                    </span>{" "}
                    {a.title}
                  </button>
                ))}
                {eventos.length > 3 && (
                  <span className="block px-1.5 text-[0.65rem] text-subtle">
                    +{eventos.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* modal do evento */}
      <dialog
        ref={dialogRef}
        onClose={() => setSelecionado(null)}
        onClick={(e) => {
          // clique no backdrop (fora do conteúdo) fecha
          if (e.target === dialogRef.current) setSelecionado(null);
        }}
        className="glass-panel m-auto w-[min(92vw,28rem)] rounded-2xl p-0 text-text backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        {selecionado && (
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-tight">
                {selecionado.title}
              </h3>
              <Badge tone={tomDoStatus(selecionado.status)}>
                {rotuloStatus[selecionado.status] ?? selecionado.status}
              </Badge>
            </div>

            <p className="mt-1 text-sm capitalize text-muted">
              {dataExtensa.format(new Date(selecionado.startsAt))}
            </p>
            <p className="text-sm tabular-nums text-muted">
              {horaCurta.format(new Date(selecionado.startsAt))} —{" "}
              {horaCurta.format(new Date(selecionado.endsAt))}
            </p>

            <dl className="mt-4 space-y-3 border-t border-border pt-4">
              <div>
                <dt className="text-xs text-subtle">Cliente</dt>
                <dd className="mt-0.5 text-sm font-medium">
                  {selecionado.contact ? (
                    <>
                      {selecionado.contact.name}
                      {selecionado.contact.company
                        ? ` · ${selecionado.contact.company}`
                        : ""}
                    </>
                  ) : (
                    <span className="text-muted">Sem cliente vinculado</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">Email do cliente</dt>
                <dd className="mt-0.5 truncate text-sm font-medium">
                  {selecionado.contact?.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">Atendente</dt>
                <dd className="mt-0.5 truncate text-sm font-medium">
                  {selecionado.assignedTo.name ?? selecionado.assignedTo.email}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/appointments/${selecionado.id}`}
                className={buttonClasses("primary")}
              >
                <IconPencil className="size-4" />
                Editar
              </Link>

              <form
                action={deleteAppointment.bind(null, selecionado.id)}
                onSubmit={(e) => {
                  if (
                    !confirm(
                      `Excluir "${selecionado.title}"? Isso remove também do Google Calendar.`,
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                <button type="submit" className={buttonClasses("danger")}>
                  <IconTrash className="size-4" />
                  Excluir
                </button>
              </form>

              <button
                type="button"
                onClick={() => setSelecionado(null)}
                className={buttonClasses("ghost", "ml-auto")}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </dialog>

      {appointments.length === 0 && (
        <p className="mt-4 text-center text-sm text-subtle">
          Nenhum agendamento ainda.{" "}
          <Link href="/dashboard/appointments/new" className="text-brand hover:underline">
            <IconPlus className="inline size-3.5" /> Criar o primeiro
          </Link>
        </p>
      )}
    </>
  );
}
