import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/field";
import { IconChevronLeft, IconContacts, IconPlus } from "@/components/ui/icons";
import { createAppointment } from "@/features/appointments/actions";
import { AppointmentForm } from "@/features/appointments/appointment-form";
import {
  getAttendantOptions,
  getContactOptions,
} from "@/features/appointments/queries";

export default async function NewAppointmentPage() {
  const [contacts, attendants] = await Promise.all([
    getContactOptions(),
    getAttendantOptions(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <IconChevronLeft className="size-4" />
        Voltar para agendamentos
      </Link>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Novo agendamento</h1>
        <p className="mt-1 text-sm text-muted">
          Marque uma reunião com um contato do CRM.
        </p>
      </div>

      <Card className="p-5">
        {contacts.length === 0 ? (
          // sem contatos não dá pra agendar: o formulário exige um cliente
          <EmptyState
            icon={<IconContacts className="size-6" />}
            title="Você ainda não tem contatos"
            description="Um agendamento precisa estar vinculado a um contato. Cadastre o primeiro."
            action={
              <Link href="/dashboard/leads/new" className={buttonClasses("primary")}>
                <IconPlus className="size-4" />
                Novo contato
              </Link>
            }
          />
        ) : (
          <AppointmentForm
            action={createAppointment}
            contacts={contacts}
            attendants={attendants}
            submitLabel="Criar agendamento"
          />
        )}
      </Card>
    </div>
  );
}
