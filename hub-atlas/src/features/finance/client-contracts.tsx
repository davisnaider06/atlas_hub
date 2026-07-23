import { Badge } from "@/components/ui/field";
import { formatarCentavos } from "@/features/crm/money";
import { ContractForm } from "./contract-form";
import { InstallmentToggle } from "./installment-actions";
import {
  ROTULO_STATUS_PARCELA,
  ROTULO_TIPO_CONTRATO,
  tomStatusParcela,
} from "./labels";
import type { ClientContract } from "./queries";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Contratos + parcelas de um cliente, com o formulário pra adicionar. */
export function ClientContracts({
  contactId,
  contratos,
  servicos,
}: {
  contactId: string;
  contratos: ClientContract[];
  servicos: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-5">
      {contratos.map((c) => {
        const pago = c.installments
          .filter((i) => i.status === "PAID")
          .reduce((s, i) => s + i.amountCents, 0);
        const total = c.installments.reduce((s, i) => s + i.amountCents, 0);

        return (
          <div key={c.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {c.title ?? c.service?.name ?? ROTULO_TIPO_CONTRATO[c.type]}
                </p>
                <p className="text-xs text-subtle">
                  {ROTULO_TIPO_CONTRATO[c.type]}
                  {c.type === "RECURRING"
                    ? ` · ${formatarCentavos(c.monthlyCents ?? 0)}/mês`
                    : ""}
                </p>
              </div>
              <span className="text-xs tabular-nums text-muted">
                {formatarCentavos(pago)} / {formatarCentavos(total)}
              </span>
            </div>

            <ul className="mt-3 space-y-1.5">
              {c.installments.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center gap-3 rounded-lg bg-surface-sunken/40 px-3 py-2"
                >
                  <span className="w-8 shrink-0 text-xs text-subtle">#{i.number}</span>
                  <span className="flex-1 text-xs text-muted">
                    vence {dataCurta.format(i.dueDate)}
                  </span>
                  <Badge tone={tomStatusParcela(i.efetivo)}>
                    {ROTULO_STATUS_PARCELA[i.efetivo]}
                  </Badge>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatarCentavos(i.amountCents)}
                  </span>
                  <InstallmentToggle id={i.id} pago={i.status === "PAID"} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div className="border-t border-border pt-4">
        <p className="mb-3 text-sm font-medium">Novo contrato</p>
        <ContractForm contactId={contactId} servicos={servicos} />
      </div>
    </div>
  );
}
