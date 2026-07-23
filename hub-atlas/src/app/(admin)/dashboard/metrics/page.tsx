import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/field";
import { IconTeam } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/current-user";
import { can, ROTULO_PAPEL } from "@/features/auth/permissions";
import { formatarCentavos } from "@/features/crm/money";
import { getSdrMetrics } from "@/features/metrics/queries";
import { GoalEditor } from "@/features/metrics/goal-editor";

const mesAtual = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function iniciais(t: string) {
  return t
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function MetricsPage() {
  const eu = await getCurrentUser();
  if (!can(eu?.role, "metrics.view")) notFound();

  const sdrs = await getSdrMetrics();
  const totalVendas = sdrs.reduce((s, m) => s + m.vendas, 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Desempenho dos SDRs</h1>
        <p className="mt-1 text-sm capitalize text-muted">
          {mesAtual.format(new Date())} · {formatarCentavos(totalVendas)} vendidos no time
        </p>
      </div>

      {sdrs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconTeam className="size-6" />}
            title="Nenhum SDR"
            description="Cadastre pessoas na Equipe para acompanhar o desempenho."
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sdrs.map((m) => {
            const bateu = m.progresso >= 100;
            return (
              <Card key={m.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-xs font-semibold text-brand">
                      {iniciais(m.name ?? m.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.name ?? m.email}</p>
                      <p className="text-xs text-subtle">{ROTULO_PAPEL[m.role]}</p>
                    </div>
                  </div>
                  <GoalEditor
                    userId={m.id}
                    targetCents={m.meta}
                    commissionPercent={m.commissionPercent}
                  />
                </div>

                {/* progresso da meta */}
                <div className="mt-4">
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {formatarCentavos(m.vendas)}
                    </span>
                    <span className="pb-0.5 text-xs text-subtle">
                      meta {formatarCentavos(m.meta)}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        bateu ? "bg-success" : "bg-brand"
                      }`}
                      style={{ width: `${m.progresso}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className={bateu ? "font-medium text-success" : "text-muted"}>
                      {m.progresso}% da meta{bateu ? " · batida! 🎯" : ""}
                    </span>
                    {m.comissao != null && (
                      <span className="text-muted">
                        comissão {formatarCentavos(m.comissao)}
                        <span className="text-subtle"> ({m.commissionPercent}%)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* números do mês */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{m.leads}</p>
                    <p className="text-xs text-subtle">leads</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{m.clientes}</p>
                    <p className="text-xs text-subtle">clientes</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{m.reunioes}</p>
                    <p className="text-xs text-subtle">reuniões/mês</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
