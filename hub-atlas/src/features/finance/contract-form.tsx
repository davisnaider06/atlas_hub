"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/field";
import { IconPlus } from "@/components/ui/icons";
import { createContract } from "./actions";

type Opcao = { id: string; name: string };

/**
 * Novo contrato. Os campos mudam conforme o tipo: projeto pontual pede total +
 * nº de parcelas; recorrente pede a mensalidade + quantos meses gerar.
 */
export function ContractForm({
  contactId,
  clientes,
  servicos,
}: {
  contactId?: string;
  clientes?: Opcao[];
  servicos: Opcao[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [tipo, setTipo] = useState<"ONE_OFF" | "RECURRING">("ONE_OFF");
  const [enviando, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const hoje = new Date().toISOString().slice(0, 10);

  function enviar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      try {
        await createContract(fd);
        formRef.current?.reset();
        setTipo("ONE_OFF");
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar");
      }
    });
  }

  return (
    <form ref={formRef} action={enviar} className="grid gap-4 sm:grid-cols-6">
      {contactId && <input type="hidden" name="contactId" value={contactId} />}

      {clientes && (
        <div className="sm:col-span-3">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="contactId">
            Cliente <span className="text-brand">*</span>
          </label>
          <select id="contactId" name="contactId" required defaultValue="" className={fieldClasses}>
            <option value="" disabled>
              Selecione
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={clientes ? "sm:col-span-3" : "sm:col-span-3"}>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="title">
          Título
        </label>
        <input
          id="title"
          name="title"
          placeholder="Ex: Site institucional"
          className={fieldClasses}
        />
      </div>

      <div className="sm:col-span-3">
        <label className="mb-1.5 block text-sm font-medium" htmlFor="type">
          Tipo <span className="text-brand">*</span>
        </label>
        <select
          id="type"
          name="type"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "ONE_OFF" | "RECURRING")}
          className={fieldClasses}
        >
          <option value="ONE_OFF">Projeto pontual (parcelado)</option>
          <option value="RECURRING">Recorrente (mensalidade)</option>
        </select>
      </div>

      <div className="sm:col-span-3">
        <label className="mb-1.5 block text-sm font-medium" htmlFor="serviceId">
          Serviço
        </label>
        <select id="serviceId" name="serviceId" defaultValue="" className={fieldClasses}>
          <option value="">Nenhum</option>
          {servicos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {tipo === "ONE_OFF" ? (
        <>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium" htmlFor="totalValue">
              Valor total (R$) <span className="text-brand">*</span>
            </label>
            <input
              id="totalValue"
              name="totalValue"
              inputMode="decimal"
              required
              placeholder="12.000,00"
              className={fieldClasses}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium" htmlFor="installmentsCount">
              Nº de parcelas <span className="text-brand">*</span>
            </label>
            <input
              id="installmentsCount"
              name="installmentsCount"
              type="number"
              min={1}
              max={120}
              defaultValue={1}
              required
              className={fieldClasses}
            />
          </div>
        </>
      ) : (
        <>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium" htmlFor="monthlyValue">
              Mensalidade (R$) <span className="text-brand">*</span>
            </label>
            <input
              id="monthlyValue"
              name="monthlyValue"
              inputMode="decimal"
              required
              placeholder="1.500,00"
              className={fieldClasses}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium" htmlFor="monthsToGenerate">
              Gerar meses
            </label>
            <input
              id="monthsToGenerate"
              name="monthsToGenerate"
              type="number"
              min={1}
              max={120}
              defaultValue={12}
              className={fieldClasses}
            />
          </div>
        </>
      )}

      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium" htmlFor="firstDueDate">
          1º vencimento <span className="text-brand">*</span>
        </label>
        <input
          id="firstDueDate"
          name="firstDueDate"
          type="date"
          required
          defaultValue={hoje}
          className={fieldClasses}
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-6">
        <button
          type="submit"
          disabled={enviando}
          className={buttonClasses("primary", "disabled:opacity-60")}
        >
          <IconPlus className="size-4" />
          {enviando ? "Criando…" : "Criar contrato"}
        </button>
        {erro && <span className="text-sm text-danger">{erro}</span>}
      </div>
    </form>
  );
}
