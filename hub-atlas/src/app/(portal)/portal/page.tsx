import { Card, CardHeading } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/field";
import { IconDocuments, IconSchedule } from "@/components/ui/icons";
import { getPortalData } from "@/features/portal/queries";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const rotuloStatus: Record<string, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function PortalPage() {
  const data = await getPortalData();
  const primeiroNome = data?.name?.split(" ")[0];
  const contato = data?.contact;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {primeiroNome ? `Olá, ${primeiroNome}` : "Seu portal"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Acompanhe aqui seus agendamentos e documentos com a Atlas.
        </p>
      </div>

      {/* status do cliente */}
      <Card className="p-5">
        <CardHeading label="Sua conta" title="Status" />
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-subtle">Email</dt>
            <dd className="mt-0.5 truncate text-sm font-medium">{data?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Empresa</dt>
            <dd className="mt-0.5 truncate text-sm font-medium">
              {contato?.company ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Situação</dt>
            <dd className="mt-1">
              {contato ? (
                <Badge tone="brand">{contato.stage.name}</Badge>
              ) : (
                <span className="text-sm text-muted">Cadastro em andamento</span>
              )}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* agendamentos */}
        <Card className="p-5">
          <CardHeading label="Próximos" title="Agendamentos" />
          {contato?.appointments.length ? (
            <ul className="mt-4 space-y-2">
              {contato.appointments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
                    <IconSchedule className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-subtle">{dataHora.format(a.startsAt)}</p>
                  </div>
                  <Badge tone={a.status === "CANCELED" ? "danger" : "neutral"}>
                    {rotuloStatus[a.status] ?? a.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<IconSchedule className="size-6" />}
              title="Nenhum agendamento"
              description="Quando a Atlas marcar uma reunião com você, ela aparece aqui."
            />
          )}
        </Card>

        {/* documentos */}
        <Card className="p-5">
          <CardHeading label="Compartilhados" title="Documentos" />
          {contato?.documents.length ? (
            <ul className="mt-4 space-y-2">
              {contato.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-sunken text-muted">
                    <IconDocuments className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.fileName}</p>
                    <p className="text-xs text-subtle">
                      {formatarTamanho(doc.sizeBytes)} · {dataCurta.format(doc.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<IconDocuments className="size-6" />}
              title="Nenhum documento"
              description="Arquivos compartilhados pela Atlas vão aparecer aqui."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
