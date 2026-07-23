import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeading } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/field";
import { IconServices } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/current-user";
import { can } from "@/features/auth/permissions";
import { getContacts } from "@/features/crm/queries";
import { getActiveServices } from "@/features/services/queries";
import { formatarCentavos } from "@/features/crm/money";
import {
  getContracts,
  getExpenses,
  getFinanceSummary,
  getReceivables,
} from "@/features/finance/queries";
import { ContractForm } from "@/features/finance/contract-form";
import { InstallmentToggle } from "@/features/finance/installment-actions";
import { ExpenseManager } from "@/features/finance/expense-manager";
import {
  ROTULO_STATUS_PARCELA,
  ROTULO_TIPO_CONTRATO,
  tomStatusParcela,
} from "@/features/finance/labels";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function StatTile({
  label,
  valorCents,
  tom,
}: {
  label: string;
  valorCents: number;
  tom?: "danger" | "success" | "brand";
}) {
  const cor =
    tom === "danger" ? "text-danger" : tom === "success" ? "text-success" : "text-text";
  return (
    <Card className="p-4">
      <p className="text-xs text-subtle">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${cor}`}>
        {formatarCentavos(valorCents)}
      </p>
    </Card>
  );
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const eu = await getCurrentUser();
  if (!can(eu?.role, "finance.view")) notFound();

  const podeDespesas = can(eu?.role, "finance.expenses");
  const { aba } = await searchParams;
  const abaAtual = aba === "contratos" || aba === "despesas" ? aba : "receber";

  const [resumo, receber, contratos, clientes, servicos, despesas] = await Promise.all([
    getFinanceSummary(),
    abaAtual === "receber" ? getReceivables() : Promise.resolve([]),
    abaAtual === "contratos" ? getContracts() : Promise.resolve([]),
    getContacts(undefined, "CLIENT"),
    getActiveServices(),
    abaAtual === "despesas" && podeDespesas
      ? getExpenses()
      : Promise.resolve(null),
  ]);

  const abas = [
    { id: "receber", label: "A receber" },
    { id: "contratos", label: "Contratos" },
    ...(podeDespesas ? [{ id: "despesas", label: "Despesas" }] : []),
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Financeiro</h1>
        <p className="mt-1 text-sm text-muted">
          Contratos, parcelas e recebimentos da Atlas.
        </p>
      </div>

      {/* resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Recebido no mês" valorCents={resumo.recebidoMes} tom="success" />
        <StatTile label="A receber" valorCents={resumo.aReceber} />
        <StatTile label="Atrasado" valorCents={resumo.atrasado} tom="danger" />
        <StatTile label="Recorrente / mês (MRR)" valorCents={resumo.mrr} tom="brand" />
      </div>

      {/* abas */}
      <div className="flex w-fit rounded-full border border-border p-0.5">
        {abas.map((t) => (
          <Link
            key={t.id}
            href={t.id === "receber" ? "/dashboard/finance" : `/dashboard/finance?aba=${t.id}`}
            className={
              abaAtual === t.id
                ? "rounded-full bg-brand-subtle px-3.5 py-1.5 text-sm font-medium text-brand"
                : "rounded-full px-3.5 py-1.5 text-sm text-muted hover:text-text"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {abaAtual === "receber" && (
        <Card className="p-5">
          <CardHeading label="Parcelas em aberto" title="A receber" />
          {receber.length === 0 ? (
            <EmptyState
              icon={<IconServices className="size-6" />}
              title="Nada a receber"
              description="Quando um contrato for criado, as parcelas aparecem aqui."
            />
          ) : (
            <ul className="mt-4 space-y-2">
              {receber.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/leads/${p.contract.contact.id}`}
                      className="truncate text-sm font-medium hover:text-brand"
                    >
                      {p.contract.contact.name}
                    </Link>
                    <p className="truncate text-xs text-subtle">
                      {p.contract.title ?? ROTULO_TIPO_CONTRATO[p.contract.type]} · parcela{" "}
                      {p.number} · vence {dataCurta.format(p.dueDate)}
                    </p>
                  </div>
                  <Badge tone={tomStatusParcela(p.efetivo)}>
                    {ROTULO_STATUS_PARCELA[p.efetivo]}
                  </Badge>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatarCentavos(p.amountCents)}
                  </span>
                  <InstallmentToggle id={p.id} pago={false} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {abaAtual === "contratos" && (
        <>
          <Card className="p-5">
            <CardHeading label="Novo" title="Criar contrato" />
            <div className="mt-4">
              <ContractForm
                clientes={clientes.map((c) => ({ id: c.id, name: c.name }))}
                servicos={servicos.map((s) => ({ id: s.id, name: s.name }))}
              />
            </div>
          </Card>

          <Card className="p-5">
            <CardHeading
              label={`${contratos.length} ${contratos.length === 1 ? "contrato" : "contratos"}`}
              title="Contratos"
            />
            {contratos.length === 0 ? (
              <EmptyState
                icon={<IconServices className="size-6" />}
                title="Nenhum contrato"
                description="Crie o primeiro contrato acima."
              />
            ) : (
              <ul className="mt-4 space-y-2">
                {contratos.map((c) => {
                  const pct =
                    c.totalParcelado > 0
                      ? Math.round((c.pago / c.totalParcelado) * 100)
                      : 0;
                  return (
                    <li key={c.id} className="rounded-xl border border-border p-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/leads/${c.contact.id}`}
                            className="truncate text-sm font-medium hover:text-brand"
                          >
                            {c.contact.name}
                          </Link>
                          <p className="truncate text-xs text-subtle">
                            {c.title ?? c.service?.name ?? "—"} ·{" "}
                            {ROTULO_TIPO_CONTRATO[c.type]}
                          </p>
                        </div>
                        <Badge tone={c.type === "RECURRING" ? "brand" : "neutral"}>
                          {c.type === "RECURRING"
                            ? `${formatarCentavos(c.monthlyCents ?? 0)}/mês`
                            : formatarCentavos(c.totalCents ?? c.totalParcelado)}
                        </Badge>
                        <span className="shrink-0 text-xs tabular-nums text-muted">
                          {formatarCentavos(c.pago)} / {formatarCentavos(c.totalParcelado)}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className="h-full rounded-full bg-success"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}

      {abaAtual === "despesas" && podeDespesas && despesas && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatTile label="Despesas no mês" valorCents={despesas.totalMes} tom="danger" />
            <StatTile label="Custos fixos / mês" valorCents={despesas.fixasMensais} />
          </div>
          <Card className="p-5">
            <CardHeading label="Só sócios veem esta aba" title="Despesas" />
            <div className="mt-4">
              <ExpenseManager despesas={despesas.despesas} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
