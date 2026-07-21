import { buttonClasses } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/field";
import type { AppointmentDetail, AttendantOption, ContactOption } from "./queries";

const labelClasses = "mb-1.5 block text-sm font-medium text-text";

/** Converte Date -> valor aceito por <input type="datetime-local"> (hora local). */
function paraInputLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

const duracoes = [15, 30, 45, 60, 90, 120];

export function AppointmentForm({
  action,
  contacts,
  attendants,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  contacts: ContactOption[];
  attendants: AttendantOption[];
  defaultValues?: AppointmentDetail;
  submitLabel: string;
}) {
  const duracaoAtual = defaultValues
    ? Math.round(
        (defaultValues.endsAt.getTime() - defaultValues.startsAt.getTime()) / 60_000,
      )
    : 60;

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <label className={labelClasses} htmlFor="title">
          Título <span className="text-brand">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="Reunião de alinhamento"
          defaultValue={defaultValues?.title ?? ""}
          className={fieldClasses}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="contactId">
            Cliente <span className="text-brand">*</span>
          </label>
          <select
            id="contactId"
            name="contactId"
            required
            defaultValue={defaultValues?.contactId ?? ""}
            className={fieldClasses}
          >
            <option value="" disabled>
              Selecione um contato
            </option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses} htmlFor="assignedToId">
            Atendente <span className="text-brand">*</span>
          </label>
          <select
            id="assignedToId"
            name="assignedToId"
            required
            defaultValue={defaultValues?.assignedToId ?? ""}
            className={fieldClasses}
          >
            <option value="" disabled>
              Quem vai atender
            </option>
            {attendants.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="startsAt">
            Início <span className="text-brand">*</span>
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={
              defaultValues ? paraInputLocal(defaultValues.startsAt) : undefined
            }
            className={fieldClasses}
          />
        </div>

        <div>
          <label className={labelClasses} htmlFor="durationMinutes">
            Duração
          </label>
          <select
            id="durationMinutes"
            name="durationMinutes"
            defaultValue={duracaoAtual}
            className={fieldClasses}
          >
            {/* garante que uma duração fora da lista (ex: editada no banco) não suma */}
            {(duracoes.includes(duracaoAtual)
              ? duracoes
              : [...duracoes, duracaoAtual].sort((a, b) => a - b)
            ).map((min) => (
              <option key={min} value={min}>
                {min} minutos
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClasses} htmlFor="notes">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Pauta, links, contexto..."
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
