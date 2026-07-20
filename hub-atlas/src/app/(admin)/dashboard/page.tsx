import Link from "next/link";
import { getDashboardData } from "@/features/dashboard/queries";
import { ContactsChart } from "@/features/dashboard/contacts-chart";
import { Card, CardHeading, DeltaChip } from "@/components/ui/card";
import { IconContacts, IconPlus, IconTrendUp } from "@/components/ui/icons";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function AdminDashboardPage() {
  const d = await getDashboardData();
  const maiorEstagio = Math.max(1, ...d.stages.map((s) => s._count.contacts));

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      {/* cabeçalho da página */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Visão geral</h1>
          <p className="mt-1 text-sm text-muted">
            {d.total} {d.total === 1 ? "contato" : "contatos"} na base · atualizado agora
          </p>
        </div>
        <Link
          href="/dashboard/contacts/new"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
        >
          <IconPlus className="size-4" />
          Novo contato
        </Link>
      </div>

      {/* linha 1 */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* conversão */}
        <Card className="p-5">
          <CardHeading label="Funil" title="Taxa de conversão" />
          <div className="mt-5 flex items-end gap-3">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              {d.conversao.toFixed(1)}%
            </span>
            <span className="mb-1.5">
              <DeltaChip value={d.variacao} />
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {d.ganhos} de {d.total} fecharam como ganho
          </p>

          {/* barra de progresso do funil */}
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${Math.min(100, d.conversao)}%` }}
            />
          </div>
        </Card>

        {/* atividade recente */}
        <Card className="p-5">
          <CardHeading
            label="Últimos cadastros"
            title="Atividade recente"
            action={
              <Link
                href="/dashboard/contacts"
                className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-text"
              >
                Ver todos
              </Link>
            }
          />
          <ul className="mt-4 space-y-1">
            {d.recentes.length === 0 ? (
              <li className="py-6 text-center text-sm text-subtle">
                Nenhum contato ainda.
              </li>
            ) : (
              d.recentes.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/contacts/${c.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-hover"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-sunken text-xs font-semibold text-muted">
                      {iniciais(c.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.name}</span>
                      <span className="block truncate text-xs text-subtle">
                        {c.company ?? "Sem empresa"}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-[0.7rem] text-muted">
                      {c.stage.name}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Card>

        {/* distribuição do funil */}
        <Card className="p-5">
          <CardHeading label="Distribuição" title="Contatos por estágio" />
          <ul className="mt-4 space-y-3">
            {d.stages.map((s) => (
              <li key={s.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-muted">{s.name}</span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {s._count.contacts}
                  </span>
                </div>
                {/* magnitude por estágio: matiz único, intensidade proporcional */}
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${(s._count.contacts / maiorEstagio) * 100}%`,
                      opacity: 0.35 + (s._count.contacts / maiorEstagio) * 0.65,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* linha 2 */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* gráfico principal */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-subtle">Total de contatos</p>
              <div className="mt-1 flex items-end gap-3">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  {d.total}
                </span>
                <span className="mb-1">
                  <DeltaChip value={d.variacao} />
                </span>
              </div>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              Últimos 8 meses
            </span>
          </div>

          <div className="mt-4">
            <ContactsChart data={d.serie} />
          </div>
        </Card>

        {/* card de destaque */}
        <Card className="relative overflow-hidden p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand/25 blur-3xl"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 py-1 text-xs font-medium text-brand">
            <IconTrendUp className="size-3.5" />
            Este mês
          </span>
          <p className="mt-4 text-4xl font-semibold tracking-tight tabular-nums">
            {d.mesAtual}
          </p>
          <p className="mt-1 text-sm text-muted">
            {d.mesAtual === 1 ? "novo contato" : "novos contatos"} entraram no funil
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-surface-sunken/50 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
              <IconContacts className="size-5" />
            </span>
            <p className="text-xs leading-relaxed text-muted">
              Mantenha o funil girando: mova os contatos no pipeline conforme avançam.
            </p>
          </div>

          <Link
            href="/dashboard/pipeline"
            className="mt-4 block rounded-xl bg-brand py-2.5 text-center text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
          >
            Abrir pipeline
          </Link>
        </Card>
      </div>
    </div>
  );
}
