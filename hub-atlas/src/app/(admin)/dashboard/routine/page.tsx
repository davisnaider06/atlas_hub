import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Badge, EmptyState, fieldClasses } from "@/components/ui/field";
import { IconContacts, IconPlus, IconSchedule } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/current-user";
import { can, ROTULO_PAPEL } from "@/features/auth/permissions";
import { getMembrosAtribuiveis, getRoutine } from "@/features/routine/queries";
import { completeTask, createFollowUp, createTask } from "@/features/routine/actions";
import { getContacts } from "@/features/crm/queries";

const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

const ROTULO_TIPO: Record<string, string> = {
  FOLLOW_UP: "Follow-up",
  CALL: "Ligação",
  PROPOSAL: "Proposta",
  OTHER: "Tarefa",
};

export default async function RoutinePage({
  searchParams,
}: {
  searchParams: Promise<{ membro?: string }>;
}) {
  const eu = await getCurrentUser();
  if (!can(eu?.role, "crm.manage")) notFound();

  const podeAtribuir = can(eu!.role, "tasks.assign");
  const { membro } = await searchParams;

  // ver a rotina de outra pessoa exige permissão; sem ela, sempre a própria
  const alvoId = podeAtribuir && membro ? membro : eu!.id;

  const [routine, contatos, membros] = await Promise.all([
    getRoutine(alvoId),
    getContacts(),
    podeAtribuir ? getMembrosAtribuiveis() : Promise.resolve([]),
  ]);

  const alvo = membros.find((m) => m.id === alvoId);
  const vendoOutro = alvoId !== eu!.id;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {vendoOutro
              ? `Rotina de ${alvo?.name ?? alvo?.email ?? "membro"}`
              : "Minha rotina"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {routine.total === 0
              ? "Tudo em dia por aqui."
              : `${routine.total} ${routine.total === 1 ? "item pendente" : "itens pendentes"}.`}
          </p>
        </div>

        {/* trocar de pessoa (só quem pode atribuir) */}
        {podeAtribuir && membros.length > 1 && (
          <form className="flex items-center gap-2">
            <label htmlFor="membro" className="text-xs text-subtle">
              Ver rotina de
            </label>
            <select
              id="membro"
              name="membro"
              defaultValue={alvoId}
              className="rounded-lg border border-border bg-surface-sunken/60 px-2.5 py-1.5 text-sm"
            >
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id === eu!.id ? "Eu" : (m.name ?? m.email)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:bg-surface-hover hover:text-text"
            >
              Ver
            </button>
          </form>
        )}
      </div>

      {vendoOutro && (
        <p className="rounded-xl border border-brand-border bg-brand-subtle/30 p-3 text-sm text-muted">
          Você está vendo a rotina de outra pessoa. Só ela pode concluir as tarefas
          dela — você pode criar novas abaixo.
        </p>
      )}

      {/* nova tarefa */}
      <Card className="p-5">
        <CardHeading label="Adicionar" title="Nova tarefa" />
        <form action={createTask} className="mt-4 grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className="mb-1.5 block text-sm font-medium" htmlFor="title">
              O que precisa ser feito <span className="text-brand">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="Ligar para o cliente X"
              className={fieldClasses}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="kind">
              Tipo
            </label>
            <select id="kind" name="kind" defaultValue="OTHER" className={fieldClasses}>
              {Object.entries(ROTULO_TIPO).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="dueAt">
              Quando
            </label>
            <input
              id="dueAt"
              name="dueAt"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={fieldClasses}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="contactId">
              Contato
            </label>
            <select id="contactId" name="contactId" defaultValue="" className={fieldClasses}>
              <option value="">Nenhum</option>
              {contatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* responsável: só aparece pra quem pode atribuir a outra pessoa */}
          {podeAtribuir && (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium" htmlFor="assignedToId">
                Responsável
              </label>
              <select
                id="assignedToId"
                name="assignedToId"
                defaultValue={alvoId}
                className={fieldClasses}
              >
                {membros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id === eu!.id ? "Eu" : (m.name ?? m.email)} ·{" "}
                    {ROTULO_PAPEL[m.role]}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-xs text-subtle">
                A tarefa aparece na rotina dessa pessoa quando ela entrar.
              </span>
            </div>
          )}
          <div className="sm:col-span-6">
            <button type="submit" className={buttonClasses("primary")}>
              <IconPlus className="size-4" />
              Adicionar
            </button>
          </div>
        </form>
      </Card>

      {routine.total === 0 ? (
        <Card>
          <EmptyState
            icon={<IconSchedule className="size-6" />}
            title="Nada pendente"
            description="Sem tarefas atrasadas, reuniões hoje ou leads esfriando."
          />
        </Card>
      ) : (
        <>
          {routine.atrasadas.length > 0 && (
            <Card className="p-5">
              <CardHeading label="Precisam de atenção" title="Atrasadas" />
              <ul className="mt-4 space-y-2">
                {routine.atrasadas.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger-subtle/40 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-subtle">
                        {ROTULO_TIPO[t.kind]} · venceu {dataCurta.format(t.dueAt)}
                        {t.contact ? ` · ${t.contact.name}` : ""}
                      </p>
                    </div>
                    {!vendoOutro && (
                      <form action={completeTask.bind(null, t.id)}>
                        <button type="submit" className={buttonClasses("secondary")}>
                          Concluir
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {routine.agendamentosHoje.length > 0 && (
            <Card className="p-5">
              <CardHeading label="Hoje" title="Agenda" />
              <ul className="mt-4 space-y-2">
                {routine.agendamentosHoje.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
                      <IconSchedule className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-subtle">
                        {hora.format(a.startsAt)}
                        {a.contact ? ` · ${a.contact.name}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/appointments/${a.id}`}
                      className={buttonClasses("secondary")}
                    >
                      Abrir
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {routine.tarefas.length > 0 && (
            <Card className="p-5">
              <CardHeading label="Hoje" title="Tarefas" />
              <ul className="mt-4 space-y-2">
                {routine.tarefas.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <Badge>{ROTULO_TIPO[t.kind]}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      {t.contact && (
                        <p className="text-xs text-subtle">{t.contact.name}</p>
                      )}
                    </div>
                    {!vendoOutro && (
                      <form action={completeTask.bind(null, t.id)}>
                        <button type="submit" className={buttonClasses("secondary")}>
                          Concluir
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {routine.leadsParados.length > 0 && (
            <Card className="p-5">
              <CardHeading
                label={`Sem movimentação há mais de 7 dias`}
                title="Leads esfriando"
              />
              <ul className="mt-4 space-y-2">
                {routine.leadsParados.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning-subtle text-warning">
                      <IconContacts className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/leads/${c.id}`}
                        className="truncate text-sm font-medium hover:text-brand"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-subtle">
                        {c.stage.name} · parado desde {dataCurta.format(c.updatedAt)}
                      </p>
                    </div>
                    <form action={createFollowUp.bind(null, c.id)}>
                      <button type="submit" className={buttonClasses("secondary")}>
                        Criar follow-up
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
