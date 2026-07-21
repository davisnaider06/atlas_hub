import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Badge } from "@/components/ui/field";
import { IconSchedule } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/current-user";
import { prisma } from "@/lib/prisma";
import { googleIsConfigured } from "@/features/google/oauth";
import { disconnectGoogle } from "@/features/google/actions";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Mensagens amigáveis pros erros que o callback pode devolver. */
function mensagemDeErro(erro: string) {
  const mapa: Record<string, string> = {
    google_nao_configurado:
      "As credenciais do Google não estão configuradas no servidor (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).",
    state_invalido: "A sessão de autorização expirou. Tente conectar de novo.",
    sem_code: "O Google não devolveu o código de autorização.",
    access_denied: "Você cancelou a autorização no Google.",
  };
  return mapa[erro] ?? erro;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ conectado?: string; erro?: string }>;
}) {
  const { conectado, erro } = await searchParams;
  const user = await getCurrentUser();
  const conta = user
    ? await prisma.googleAccount.findUnique({ where: { userId: user.id } })
    : null;
  const configurado = googleIsConfigured();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted">
          Integrações e preferências da sua conta.
        </p>
      </div>

      {conectado && (
        <p className="rounded-xl border border-transparent bg-success-subtle p-3 text-sm text-success">
          Google Calendar conectado com sucesso.
        </p>
      )}
      {erro && (
        <p className="rounded-xl border border-transparent bg-danger-subtle p-3 text-sm text-danger">
          {mensagemDeErro(erro)}
        </p>
      )}

      <Card className="p-5">
        <CardHeading
          label="Integração"
          title="Google Calendar"
          action={
            conta ? <Badge tone="success">Conectado</Badge> : <Badge>Desconectado</Badge>
          }
        />

        <p className="mt-3 text-sm leading-relaxed text-muted">
          Conecte sua conta Google para que os agendamentos criados no Hub apareçam na
          sua agenda e o cliente receba o convite por email automaticamente.
        </p>

        {!configurado ? (
          <p className="mt-4 rounded-xl border border-border bg-surface-sunken/50 p-3 text-xs text-muted">
            A integração ainda não foi configurada neste servidor. Defina{" "}
            <code className="font-mono">GOOGLE_CLIENT_ID</code> e{" "}
            <code className="font-mono">GOOGLE_CLIENT_SECRET</code> no ambiente.
          </p>
        ) : conta ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-success-subtle text-success">
                <IconSchedule className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{conta.googleEmail}</p>
                <p className="text-xs text-subtle">
                  Conectado em {dataCurta.format(conta.createdAt)} · agenda{" "}
                  {conta.calendarId}
                </p>
              </div>
            </div>
            <form action={disconnectGoogle}>
              <button type="submit" className={buttonClasses("secondary")}>
                Desconectar
              </button>
            </form>
          </div>
        ) : (
          <a href="/api/google/connect" className={buttonClasses("primary", "mt-4")}>
            <IconSchedule className="size-4" />
            Conectar Google Calendar
          </a>
        )}
      </Card>
    </div>
  );
}
