import Link from "next/link";
import { notFound } from "next/navigation";
import { updateContact } from "@/features/crm/actions";
import { ContactForm } from "@/features/crm/contact-form";
import { DeleteContactButton } from "@/features/crm/delete-contact-button";
import { getContactById, getPipelineStages } from "@/features/crm/queries";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contact, stages] = await Promise.all([getContactById(id), getPipelineStages()]);

  if (!contact) notFound();

  return (
    <main className="p-8">
      <Link
        href="/dashboard/contacts"
        className="mb-4 inline-block text-sm text-zinc-500 hover:underline"
      >
        ← Voltar para contatos
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{contact.name}</h1>
        <DeleteContactButton contactId={contact.id} contactName={contact.name} />
      </div>

      <ContactForm
        action={updateContact.bind(null, contact.id)}
        stages={stages}
        defaultValues={contact}
        submitLabel="Salvar alterações"
      />
    </main>
  );
}
