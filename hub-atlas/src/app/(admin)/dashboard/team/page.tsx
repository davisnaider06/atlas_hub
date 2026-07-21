import { notFound } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Badge, fieldClasses } from "@/components/ui/field";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/features/auth/current-user";
import {
  can,
  DESCRICAO_PAPEL,
  PAPEIS_ATRIBUIVEIS,
  ROTULO_PAPEL,
} from "@/features/auth/permissions";
import { inviteMember, removeMember } from "@/features/team/actions";
import { RoleSelect } from "@/features/team/role-select";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function iniciais(texto: string) {
  return texto
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function TeamPage() {
  const eu = await getCurrentUser();
  // a própria rota é restrita: quem não gerencia equipe nem vê que ela existe
  if (!can(eu?.role, "team.manage")) notFound();

  const membros = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Equipe</h1>
        <p className="mt-1 text-sm text-muted">
          Cadastre as pessoas e defina o que cada uma pode fazer. Elas entram com o
          Google e já caem com o papel definido aqui.
        </p>
      </div>

      {/* convite */}
      <Card className="p-5">
        <CardHeading label="Novo acesso" title="Cadastrar pessoa" />
        <form action={inviteMember} className="mt-4 grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
              Email <span className="text-brand">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="pessoa@atlas.com"
              className={fieldClasses}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
              Nome
            </label>
            <input id="name" name="name" placeholder="Opcional" className={fieldClasses} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="role">
              Papel
            </label>
            <select id="role" name="role" defaultValue="MEMBER" className={fieldClasses}>
              {PAPEIS_ATRIBUIVEIS.map((p) => (
                <option key={p} value={p}>
                  {ROTULO_PAPEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4">
            <button type="submit" className={buttonClasses("primary")}>
              <IconPlus className="size-4" />
              Cadastrar
            </button>
          </div>
        </form>
      </Card>

      {/* lista */}
      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <CardHeading
            label={`${membros.length} ${membros.length === 1 ? "pessoa" : "pessoas"}`}
            title="Pessoas com acesso"
          />
        </div>

        <ul className="divide-y divide-border">
          {membros.map((m) => {
            const souEu = m.id === eu?.id;
            return (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-surface-hover"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-xs font-semibold text-brand">
                  {iniciais(m.name ?? m.email)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.name ?? m.email.split("@")[0]}
                    {souEu && <span className="ml-2 text-xs text-subtle">(você)</span>}
                  </p>
                  <p className="truncate text-xs text-subtle">{m.email}</p>
                </div>

                <div className="shrink-0">
                  {m.clerkId ? (
                    <Badge tone="success">Ativo</Badge>
                  ) : (
                    <Badge>Aguardando 1º login</Badge>
                  )}
                </div>

                <span className="shrink-0 text-xs text-subtle">
                  {dataCurta.format(m.createdAt)}
                </span>

                {/* papel: salva ao mudar, sem botão */}
                <div className="shrink-0">
                  <RoleSelect
                    userId={m.id}
                    papelAtual={m.role}
                    desabilitado={souEu}
                    titulo={
                      souEu
                        ? "Você não pode mudar o próprio papel"
                        : DESCRICAO_PAPEL[m.role]
                    }
                  />
                </div>

                {!souEu && (
                  <form action={removeMember.bind(null, m.id)} className="shrink-0">
                    <button
                      type="submit"
                      title="Remover acesso"
                      className="grid size-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-danger-subtle hover:text-danger"
                    >
                      <IconTrash className="size-4" />
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {/* legenda dos papéis */}
      <Card className="p-5">
        <CardHeading label="Referência" title="O que cada papel pode fazer" />
        <dl className="mt-4 space-y-3">
          {PAPEIS_ATRIBUIVEIS.map((p) => (
            <div key={p} className="flex gap-3">
              <dt className="w-32 shrink-0">
                <Badge tone={p === "OWNER" ? "brand" : "neutral"}>{ROTULO_PAPEL[p]}</Badge>
              </dt>
              <dd className="text-sm text-muted">{DESCRICAO_PAPEL[p]}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
