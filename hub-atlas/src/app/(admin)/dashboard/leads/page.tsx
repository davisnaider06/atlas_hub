import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Badge, EmptyState, fieldClasses } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { IconContacts, IconPlus, IconSearch } from "@/components/ui/icons";
import { getContacts } from "@/features/crm/queries";
import { WhatsAppButton } from "@/features/whatsapp/whatsapp-button";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const contacts = await getContacts(q);
  const buscando = Boolean(q?.trim());

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Contatos</h1>
          <p className="mt-1 text-sm text-muted">
            {contacts.length} {contacts.length === 1 ? "contato" : "contatos"}
            {buscando ? " encontrados" : " na base"}
          </p>
        </div>
        <Link href="/dashboard/leads/new" className={buttonClasses("primary")}>
          <IconPlus className="size-4" />
          Novo contato
        </Link>
      </div>

      <Card className="overflow-hidden">
        {/* busca */}
        <form className="border-b border-border p-4">
          <div className="relative max-w-sm">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar por nome, email ou empresa"
              className={`${fieldClasses} pl-9`}
            />
          </div>
        </form>

        {contacts.length === 0 ? (
          <EmptyState
            icon={<IconContacts className="size-6" />}
            title={buscando ? "Nenhum contato encontrado" : "Nenhum contato ainda"}
            description={
              buscando
                ? "Tente outro termo de busca."
                : "Cadastre o primeiro contato pra começar a alimentar o funil."
            }
            action={
              buscando ? (
                <Link href="/dashboard/leads" className={buttonClasses("secondary")}>
                  Limpar busca
                </Link>
              ) : (
                <Link
                  href="/dashboard/leads/new"
                  className={buttonClasses("primary")}
                >
                  <IconPlus className="size-4" />
                  Novo contato
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Estágio</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="transition-colors hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/leads/${contact.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-sunken text-xs font-semibold text-muted">
                          {iniciais(contact.name)}
                        </span>
                        <span className="font-medium text-text">{contact.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{contact.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{contact.company ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge>{contact.stage.name}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <WhatsAppButton
                        telefone={contact.phone}
                        nome={contact.name}
                        variante="icone"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
