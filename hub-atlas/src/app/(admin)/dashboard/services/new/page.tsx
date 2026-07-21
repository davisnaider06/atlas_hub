import Link from "next/link";
import { Card } from "@/components/ui/card";
import { IconChevronLeft } from "@/components/ui/icons";
import { createService } from "@/features/services/actions";
import { ServiceForm } from "@/features/services/service-form";

export default function NewServicePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/dashboard/services"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <IconChevronLeft className="size-4" />
        Voltar para serviços
      </Link>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Novo serviço</h1>
        <p className="mt-1 text-sm text-muted">
          Defina a faixa de preço pra orientar a negociação.
        </p>
      </div>

      <Card className="p-5">
        <ServiceForm action={createService} submitLabel="Cadastrar serviço" />
      </Card>
    </div>
  );
}
