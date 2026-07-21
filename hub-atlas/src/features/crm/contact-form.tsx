import { buttonClasses } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/field";
import type { ContactWithStage, StageOption } from "./queries";

const labelClasses = "mb-1.5 block text-sm font-medium text-text";

export function ContactForm({
  action,
  stages,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  stages: StageOption[];
  defaultValues?: ContactWithStage;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      {/* nome e email lado a lado em telas maiores */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="name">
            Nome <span className="text-brand">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Maria Silva"
            defaultValue={defaultValues?.name ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label className={labelClasses} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="maria@empresa.com"
            defaultValue={defaultValues?.email ?? ""}
            className={fieldClasses}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="phone">
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            placeholder="(11) 90000-0000"
            defaultValue={defaultValues?.phone ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label className={labelClasses} htmlFor="company">
            Empresa
          </label>
          <input
            id="company"
            name="company"
            placeholder="Empresa LTDA"
            defaultValue={defaultValues?.company ?? ""}
            className={fieldClasses}
          />
        </div>
      </div>

      <div>
        <label className={labelClasses} htmlFor="stageId">
          Estágio <span className="text-brand">*</span>
        </label>
        <select
          id="stageId"
          name="stageId"
          required
          defaultValue={defaultValues?.stageId ?? stages[0]?.id}
          className={fieldClasses}
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClasses} htmlFor="notes">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Contexto da conversa, próximos passos..."
          defaultValue={defaultValues?.notes ?? ""}
          className={`${fieldClasses} resize-y`}
        />
      </div>

      <button type="submit" className={buttonClasses("primary", "self-start")}>
        {submitLabel}
      </button>
    </form>
  );
}
