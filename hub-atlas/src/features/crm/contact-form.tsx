"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/field";
import { centavosParaInput } from "./money";
import { ehEstagioGanho } from "./stage-rules";
import type { ContactWithStage, StageOption } from "./queries";
import type { ServiceOption } from "@/features/services/queries";

const labelClasses = "mb-1.5 block text-sm font-medium text-text";

export function ContactForm({
  action,
  stages,
  services,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  stages: StageOption[];
  services: ServiceOption[];
  defaultValues?: ContactWithStage;
  submitLabel: string;
}) {
  const estagioInicial = defaultValues?.stageId ?? stages[0]?.id ?? "";
  const [stageId, setStageId] = useState(estagioInicial);

  // os campos de contrato só fazem sentido quando o negócio foi ganho
  const estagioAtual = stages.find((s) => s.id === stageId);
  const ganhou = estagioAtual ? ehEstagioGanho(estagioAtual.name) : false;

  return (
    <form action={action} className="flex flex-col gap-5">
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
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          className={fieldClasses}
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
        {ganhou && (
          <span className="mt-1.5 block text-xs text-success">
            Ao salvar, este contato passa a constar como cliente.
          </span>
        )}
      </div>

      {/* contrato: aparece só quando o estágio é de ganho */}
      {ganhou && (
        <div className="grid gap-5 rounded-xl border border-brand-border bg-brand-subtle/30 p-4 sm:grid-cols-2">
          <div>
            <label className={labelClasses} htmlFor="serviceId">
              Serviço contratado
            </label>
            <select
              id="serviceId"
              name="serviceId"
              defaultValue={defaultValues?.serviceId ?? ""}
              className={fieldClasses}
            >
              <option value="">Selecione o serviço</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {services.length === 0 && (
              <span className="mt-1.5 block text-xs text-subtle">
                Nenhum serviço cadastrado ainda — cadastre em Serviços.
              </span>
            )}
          </div>
          <div>
            <label className={labelClasses} htmlFor="contractValue">
              Valor fechado
            </label>
            <input
              id="contractValue"
              name="contractValue"
              inputMode="decimal"
              placeholder="12.000,00"
              defaultValue={centavosParaInput(defaultValues?.contractValueCents)}
              className={fieldClasses}
            />
          </div>
        </div>
      )}

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
