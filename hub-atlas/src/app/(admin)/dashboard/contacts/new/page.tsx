import Link from "next/link";
import { Card } from "@/components/ui/card";
import { IconChevronLeft } from "@/components/ui/icons";
import { createContact } from "@/features/crm/actions";
import { ContactForm } from "@/features/crm/contact-form";
import { getPipelineStages } from "@/features/crm/queries";

export default async function NewContactPage() {
  const stages = await getPipelineStages();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <IconChevronLeft className="size-4" />
        Voltar para contatos
      </Link>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Novo contato</h1>
        <p className="mt-1 text-sm text-muted">
          Preencha os dados e escolha em qual estágio do funil ele entra.
        </p>
      </div>

      <Card className="p-5">
        <ContactForm action={createContact} stages={stages} submitLabel="Criar contato" />
      </Card>
    </div>
  );
}
