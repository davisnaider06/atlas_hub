import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/field";
import { IconPlus, IconSchedule } from "@/components/ui/icons";
import { CalendarView } from "@/features/appointments/calendar-view";
import { SyncOnOpen } from "@/features/google/sync-on-open";
import { getCurrentUser } from "@/features/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  getAppointmentsAroundNow,
  getPastAppointments,
  getUpcomingAppointments,
  type AppointmentListItem,
} from "@/features/appointments/queries";

const dataLonga = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

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

function LinhaAgendamento({ a }: { a: AppointmentListItem }) {
  return (
    <li>
      <Link
        href={`/dashboard/appointments/${a.id}`}
        className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-surface-hover"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
          <IconSchedule className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{a.title}</p>
          <p className="truncate text-xs text-subtle">
            {a.contact?.name ?? "Sem cliente"}
            {a.assignedTo ? ` · com ${a.assignedTo.name ?? a.assignedTo.email}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium tabular-nums">{dataLonga.format(a.startsAt)}</p>
          <p className="text-xs text-subtle tabular-nums">até {hora.format(a.endsAt)}</p>
        </div>
        <Badge tone={tomDoStatus(a.status)}>{rotuloStatus[a.status] ?? a.status}</Badge>
      </Link>
    </li>
  );
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ vis?: string }>;
}) {
  const { vis } = await searchParams;
  const modoLista = vis === "lista";

  const user = await getCurrentUser();
  const contaGoogle = user
    ? await prisma.googleAccount.findUnique({ where: { userId: user.id } })
    : null;

  // busca só o que a visão atual precisa
  const [doCalendario, proximos, passados] = await Promise.all([
    modoLista ? Promise.resolve([]) : getAppointmentsAroundNow(),
    modoLista ? getUpcomingAppointments() : Promise.resolve([]),
    modoLista ? getPastAppointments() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Agendamentos</h1>
          <p className="mt-1 text-sm text-muted">
            {contaGoogle
              ? "Sincronizado nos dois sentidos com a agenda Atlas Agendamentos."
              : "Conecte o Google Calendar em Configurações para sincronizar."}
          </p>
          <SyncOnOpen conectado={Boolean(contaGoogle)} />
        </div>

        <div className="flex items-center gap-2">
          {/* alternador de visão */}
          <div className="flex rounded-full border border-border p-0.5">
            <Link
              href="/dashboard/appointments"
              className={
                modoLista
                  ? "rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-text"
                  : "rounded-full bg-brand-subtle px-3 py-1.5 text-sm font-medium text-brand"
              }
            >
              Calendário
            </Link>
            <Link
              href="/dashboard/appointments?vis=lista"
              className={
                modoLista
                  ? "rounded-full bg-brand-subtle px-3 py-1.5 text-sm font-medium text-brand"
                  : "rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-text"
              }
            >
              Lista
            </Link>
          </div>

          <Link href="/dashboard/appointments/new" className={buttonClasses("primary")}>
            <IconPlus className="size-4" />
            Novo
          </Link>
        </div>
      </div>

      {modoLista ? (
        <>
          <Card className="p-5">
            <CardHeading label="A partir de agora" title="Próximos" />
            {proximos.length === 0 ? (
              <EmptyState
                icon={<IconSchedule className="size-6" />}
                title="Nenhum agendamento marcado"
                description="Marque uma reunião com um contato do CRM."
                action={
                  <Link
                    href="/dashboard/appointments/new"
                    className={buttonClasses("primary")}
                  >
                    <IconPlus className="size-4" />
                    Novo agendamento
                  </Link>
                }
              />
            ) : (
              <ul className="mt-4 space-y-2">
                {proximos.map((a) => (
                  <LinhaAgendamento key={a.id} a={a} />
                ))}
              </ul>
            )}
          </Card>

          {passados.length > 0 && (
            <Card className="p-5">
              <CardHeading label="Já aconteceram ou foram cancelados" title="Histórico" />
              <ul className="mt-4 space-y-2">
                {passados.map((a) => (
                  <LinhaAgendamento key={a.id} a={a} />
                ))}
              </ul>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-5">
          <CalendarView appointments={doCalendario} />
        </Card>
      )}
    </div>
  );
}
