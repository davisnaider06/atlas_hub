import { buttonClasses } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/field";
import { centavosParaInput } from "@/features/crm/money";
import type { ServiceListItem } from "./queries";

const labelClasses = "mb-1.5 block text-sm font-medium text-text";

export function ServiceForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: ServiceListItem;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <label className={labelClasses} htmlFor="name">
          Nome do serviço <span className="text-brand">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Ex: Automação com IA"
          defaultValue={defaultValues?.name ?? ""}
          className={fieldClasses}
        />
      </div>

      <div>
        <label className={labelClasses} htmlFor="description">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="O que está incluso, prazo médio, o que diferencia..."
          defaultValue={defaultValues?.description ?? ""}
          className={`${fieldClasses} resize-y`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="priceMin">
            Valor mínimo (piso)
          </label>
          <input
            id="priceMin"
            name="priceMin"
            inputMode="decimal"
            placeholder="5.000,00"
            defaultValue={centavosParaInput(defaultValues?.priceMinCents)}
            className={fieldClasses}
          />
          <span className="mt-1.5 block text-xs text-subtle">
            Abaixo disso não vale a pena fechar.
          </span>
        </div>
        <div>
          <label className={labelClasses} htmlFor="priceMax">
            Valor máximo (teto)
          </label>
          <input
            id="priceMax"
            name="priceMax"
            inputMode="decimal"
            placeholder="25.000,00"
            defaultValue={centavosParaInput(defaultValues?.priceMaxCents)}
            className={fieldClasses}
          />
          <span className="mt-1.5 block text-xs text-subtle">
            Referência de teto pra negociação.
          </span>
        </div>
      </div>

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="size-4 accent-[var(--brand)]"
        />
        <span className="text-sm">
          Ativo
          <span className="ml-1.5 text-xs text-subtle">
            (inativo some dos seletores, mas continua nos clientes que já contrataram)
          </span>
        </span>
      </label>

      <button type="submit" className={buttonClasses("primary", "self-start")}>
        {submitLabel}
      </button>
    </form>
  );
}
