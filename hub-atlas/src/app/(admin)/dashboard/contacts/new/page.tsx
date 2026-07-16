import Link from "next/link";
import { createContact } from "@/features/crm/actions";
import { ContactForm } from "@/features/crm/contact-form";
import { getPipelineStages } from "@/features/crm/queries";

export default async function NewContactPage() {
  const stages = await getPipelineStages();

  return (
    <main className="p-8">
      <Link
        href="/dashboard/contacts"
        className="mb-4 inline-block text-sm text-zinc-500 hover:underline"
      >
        ← Voltar para contatos
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Novo contato</h1>
      <ContactForm action={createContact} stages={stages} submitLabel="Criar contato" />
    </main>
  );
}
