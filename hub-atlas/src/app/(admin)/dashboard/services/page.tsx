import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/field";
import { IconPlus, IconServices } from "@/components/ui/icons";
import { formatarFaixa } from "@/features/crm/money";
import { getServices } from "@/features/services/queries";

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Serviços</h1>
          <p className="mt-1 text-sm text-muted">
            O que a Atlas oferece e a faixa de preço de cada um.
          </p>
        </div>
        <Link href="/dashboard/services/new" className={buttonClasses("primary")}>
          <IconPlus className="size-4" />
          Novo serviço
        </Link>
      </div>

      {services.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconServices className="size-6" />}
            title="Nenhum serviço cadastrado"
            description="Cadastre o que vocês vendem — sites, softwares, automações com IA — pra poder vincular aos clientes fechados."
            action={
              <Link href="/dashboard/services/new" className={buttonClasses("primary")}>
                <IconPlus className="size-4" />
                Cadastrar primeiro serviço
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Link
              key={s.id}
              href={`/dashboard/services/${s.id}`}
              className="anima-entrada"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Card className="h-full p-5 transition-colors hover:border-brand-border">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
                    <IconServices className="size-5" />
                  </span>
                  {!s.active && <Badge>Inativo</Badge>}
                </div>

                <h2 className="mt-3.5 text-base font-semibold tracking-tight">{s.name}</h2>
                {s.description && (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                    {s.description}
                  </p>
                )}

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-subtle">Faixa</p>
                    <p className="text-sm font-medium tabular-nums">
                      {formatarFaixa(s.priceMinCents, s.priceMaxCents)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-subtle">
                    {s._count.contacts}{" "}
                    {s._count.contacts === 1 ? "cliente" : "clientes"}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
