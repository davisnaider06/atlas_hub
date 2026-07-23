import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeading } from "@/components/ui/card";
import { Badge } from "@/components/ui/field";
import { IconChevronLeft } from "@/components/ui/icons";
import { updateContact } from "@/features/crm/actions";
import { ContactForm } from "@/features/crm/contact-form";
import { DeleteContactButton } from "@/features/crm/delete-contact-button";
import { WhatsAppButton } from "@/features/whatsapp/whatsapp-button";
import { getContactById, getPipelineStages } from "@/features/crm/queries";
import { getActiveServices } from "@/features/services/queries";
import { getContactDocuments } from "@/features/documents/queries";
import { DocumentList } from "@/features/documents/document-list";
import { UploadForm } from "@/features/documents/upload-form";
import { getCurrentUser } from "@/features/auth/current-user";
import { can } from "@/features/auth/permissions";
import { getClientContracts } from "@/features/finance/queries";
import { ClientContracts } from "@/features/finance/client-contracts";
import { OwnerSelect } from "@/features/crm/owner-select";
import { getMembrosAtribuiveis } from "@/features/routine/queries";

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
  const [contact, stages, services, documentos, eu, sdrs] = await Promise.all([
    getContactById(id),
    getPipelineStages(),
    getActiveServices(),
    getContactDocuments(id),
    getCurrentUser(),
    getMembrosAtribuiveis(),
  ]);

  if (!contact) notFound();

  // contratos: só pra quem vê financeiro e quando o contato já é cliente
  const mostrarFinanceiro = can(eu?.role, "finance.view") && contact.type === "CLIENT";
  const contratos = mostrarFinanceiro ? await getClientContracts(id) : [];

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
          <div className="flex items-center gap-2">
            <WhatsAppButton telefone={contact.phone} nome={contact.name} />
            <DeleteContactButton contactId={contact.id} contactName={contact.name} />
          </div>
        </div>

        {/* SDR responsável */}
        <div className="mt-4 border-t border-border pt-3">
          <OwnerSelect
            contactId={contact.id}
            ownerId={contact.ownerId}
            sdrs={sdrs}
          />
        </div>
      </Card>

      {/* documentos do contato */}
      <Card className="p-5">
        <CardHeading
          label={`${documentos.length} ${documentos.length === 1 ? "arquivo" : "arquivos"}`}
          title="Documentos"
        />
        <div className="mt-4">
          <UploadForm contactId={contact.id} />
        </div>
        {documentos.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <DocumentList documentos={documentos} />
          </div>
        )}
      </Card>

      {/* contratos & financeiro (só cliente + quem vê financeiro) */}
      {mostrarFinanceiro && (
        <Card className="p-5">
          <CardHeading
            label={`${contratos.length} ${contratos.length === 1 ? "contrato" : "contratos"}`}
            title="Contratos & financeiro"
          />
          <div className="mt-4">
            <ClientContracts
              contactId={contact.id}
              contratos={contratos}
              servicos={services.map((s) => ({ id: s.id, name: s.name }))}
            />
          </div>
        </Card>
      )}

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
