import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/field";
import { IconChevronLeft } from "@/components/ui/icons";
import { updateAppointment } from "@/features/appointments/actions";
import { AppointmentForm } from "@/features/appointments/appointment-form";
import { AppointmentActionsBar } from "@/features/appointments/appointment-actions-bar";
import { SyncBadge } from "@/features/appointments/sync-badge";
import {
  getAppointmentById,
  getAttendantOptions,
  getContactOptions,
} from "@/features/appointments/queries";

const dataLonga = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const rotuloStatus: Record<string, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [appointment, contacts, attendants] = await Promise.all([
    getAppointmentById(id),
    getContactOptions(),
    getAttendantOptions(),
  ]);

  if (!appointment) notFound();

  const tom =
    appointment.status === "CANCELED"
      ? ("danger" as const)
      : appointment.status === "COMPLETED"
        ? ("success" as const)
        : ("brand" as const);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <IconChevronLeft className="size-4" />
        Voltar para agendamentos
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {appointment.title}
              </h1>
              <Badge tone={tom}>
                {rotuloStatus[appointment.status] ?? appointment.status}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {dataLonga.format(appointment.startsAt)}
            </p>
          </div>
          <AppointmentActionsBar
            id={appointment.id}
            status={appointment.status}
            title={appointment.title}
          />
        </div>

        <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-subtle">Cliente</dt>
            <dd className="mt-0.5 truncate text-sm font-medium">
              {appointment.contact ? (
                <Link
                  href={`/dashboard/leads/${appointment.contact.id}`}
                  className="hover:text-brand"
                >
                  {appointment.contact.name}
                </Link>
              ) : (
                <span className="text-muted">Sem cliente vinculado</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Email do cliente</dt>
            <dd className="mt-0.5 truncate text-sm font-medium">
              {appointment.contact?.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Atendente</dt>
            <dd className="mt-0.5 truncate text-sm font-medium">
              {appointment.assignedTo.name ?? appointment.assignedTo.email}
            </dd>
          </div>
        </dl>

        {/* não chegou ao Google: avisa e oferece reenvio */}
        {!appointment.googleEventId && appointment.status === "SCHEDULED" && (
          <SyncBadge appointmentId={appointment.id} />
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-5 text-base font-semibold tracking-tight">
          Editar agendamento
        </h2>
        <AppointmentForm
          action={updateAppointment.bind(null, appointment.id)}
          contacts={contacts}
          attendants={attendants}
          defaultValues={appointment}
          submitLabel="Salvar alterações"
        />
      </Card>
    </div>
  );
}
