import { buttonClasses } from "@/components/ui/button";
import type { ContactWithStage, StageOption } from "./queries";

const inputClasses =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

const labelClasses = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

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
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <div>
        <label className={labelClasses} htmlFor="name">
          Nome *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          className={inputClasses}
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
          defaultValue={defaultValues?.email ?? ""}
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses} htmlFor="phone">
          Telefone
        </label>
        <input
          id="phone"
          name="phone"
          defaultValue={defaultValues?.phone ?? ""}
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses} htmlFor="company">
          Empresa
        </label>
        <input
          id="company"
          name="company"
          defaultValue={defaultValues?.company ?? ""}
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses} htmlFor="stageId">
          Estágio *
        </label>
        <select
          id="stageId"
          name="stageId"
          required
          defaultValue={defaultValues?.stageId ?? stages[0]?.id}
          className={inputClasses}
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
          defaultValue={defaultValues?.notes ?? ""}
          className={inputClasses}
        />
      </div>
      <button type="submit" className={buttonClasses("primary", "self-start")}>
        {submitLabel}
      </button>
    </form>
  );
}
