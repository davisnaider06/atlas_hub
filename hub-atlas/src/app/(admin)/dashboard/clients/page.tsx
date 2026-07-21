import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge, EmptyState, fieldClasses } from "@/components/ui/field";
import { IconClients, IconSearch } from "@/components/ui/icons";
import { formatarCentavos } from "@/features/crm/money";
import { getContacts } from "@/features/crm/queries";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clientes = await getContacts(q, "CLIENT");
  const buscando = Boolean(q?.trim());

  const receita = clientes.reduce((s, c) => s + (c.contractValueCents ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted">
            {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
            {receita > 0 ? ` · ${formatarCentavos(receita)} em contratos` : ""}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <form className="border-b border-border p-4">
          <div className="relative max-w-sm">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar cliente"
              className={`${fieldClasses} pl-9`}
            />
          </div>
        </form>

        {clientes.length === 0 ? (
          <EmptyState
            icon={<IconClients className="size-6" />}
            title={buscando ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
            description={
              buscando
                ? "Tente outro termo."
                : "Um lead vira cliente automaticamente quando entra no estágio Fechado - Ganho."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Serviço contratado</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clientes.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/leads/${c.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-xs font-semibold text-brand">
                          {iniciais(c.name)}
                        </span>
                        <span className="font-medium text-text">{c.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{c.company ?? "—"}</td>
                    <td className="px-4 py-3">
                      {c.service ? (
                        <Badge tone="brand">{c.service.name}</Badge>
                      ) : (
                        <span className="text-subtle">Não informado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatarCentavos(c.contractValueCents) ?? "—"}
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
