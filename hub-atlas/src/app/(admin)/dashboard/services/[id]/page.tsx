import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconChevronLeft, IconTrash } from "@/components/ui/icons";
import { deleteService, updateService } from "@/features/services/actions";
import { ServiceForm } from "@/features/services/service-form";
import { getServiceById } from "@/features/services/queries";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/dashboard/services"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <IconChevronLeft className="size-4" />
        Voltar para serviços
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{service.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {service._count.contacts}{" "}
            {service._count.contacts === 1
              ? "cliente contratou"
              : "clientes contrataram"}{" "}
            este serviço.
          </p>
        </div>

        <form action={deleteService.bind(null, service.id)}>
          <button type="submit" className={buttonClasses("danger")}>
            <IconTrash className="size-4" />
            Excluir
          </button>
        </form>
      </div>

      <Card className="p-5">
        <ServiceForm
          action={updateService.bind(null, service.id)}
          defaultValues={service}
          submitLabel="Salvar alterações"
        />
      </Card>
    </div>
  );
}
