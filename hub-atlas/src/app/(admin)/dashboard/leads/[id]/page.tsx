import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/field";
import { IconChevronLeft } from "@/components/ui/icons";
import { updateContact } from "@/features/crm/actions";
import { ContactForm } from "@/features/crm/contact-form";
import { DeleteContactButton } from "@/features/crm/delete-contact-button";
import { getContactById, getPipelineStages } from "@/features/crm/queries";
import { getActiveServices } from "@/features/services/queries";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contact, stages, services] = await Promise.all([
    getContactById(id),
    getPipelineStages(),
    getActiveServices(),
  ]);

  if (!contact) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <IconChevronLeft className="size-4" />
        Voltar para contatos
      </Link>

      {/* cabeçalho do contato */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/15 text-sm font-semibold text-brand">
              {iniciais(contact.name)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {contact.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                <Badge tone="brand">{contact.stage.name}</Badge>
                {contact.company ? <span>{contact.company}</span> : null}
              </div>
            </div>
          </div>
          <DeleteContactButton contactId={contact.id} contactName={contact.name} />
        </div>
      </Card>

      {/* edição */}
      <Card className="p-5">
        <h2 className="mb-5 text-base font-semibold tracking-tight">Editar contato</h2>
        <ContactForm
          action={updateContact.bind(null, contact.id)}
          stages={stages}
          services={services}
          defaultValues={contact}
          submitLabel="Salvar alterações"
        />
      </Card>
    </div>
  );
}
