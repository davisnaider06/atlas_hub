"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Badge, fieldClasses } from "@/components/ui/field";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { formatarCentavos } from "@/features/crm/money";
import { createExpense, deleteExpense } from "./actions";
import { ROTULO_CATEGORIA_DESPESA } from "./labels";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type Despesa = {
  id: string;
  description: string;
  amountCents: number;
  category: string;
  spentAt: Date;
  recurring: boolean;
  createdBy: { name: string | null; email: string };
};

export function ExpenseManager({ despesas }: { despesas: Despesa[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const hoje = new Date().toISOString().slice(0, 10);

  function enviar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      try {
        await createExpense(fd);
        formRef.current?.reset();
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar");
      }
    });
  }

  function remover(id: string) {
    if (!confirm("Excluir esta despesa?")) return;
    startTransition(async () => {
      await deleteExpense(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <form ref={formRef} action={enviar} className="grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="description">
            Descrição <span className="text-brand">*</span>
          </label>
          <input
            id="description"
            name="description"
            required
            placeholder="Ex: Assinatura de ferramenta"
            className={fieldClasses}
          />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="amount">
            Valor (R$) <span className="text-brand">*</span>
          </label>
          <input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            placeholder="199,90"
            className={fieldClasses}
          />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="category">
            Categoria
          </label>
          <select id="category" name="category" defaultValue="OTHER" className={fieldClasses}>
            {Object.entries(ROTULO_CATEGORIA_DESPESA).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="spentAt">
            Data
          </label>
          <input
            id="spentAt"
            name="spentAt"
            type="date"
            defaultValue={hoje}
            className={fieldClasses}
          />
        </div>
        <label className="flex items-center gap-2 sm:col-span-3">
          <input
            type="checkbox"
            name="recurring"
            className="size-4 accent-[var(--brand)]"
          />
          <span className="text-sm">Custo fixo mensal</span>
        </label>
        <div className="flex items-center gap-3 sm:col-span-6">
          <button
            type="submit"
            disabled={enviando}
            className={buttonClasses("primary", "disabled:opacity-60")}
          >
            <IconPlus className="size-4" />
            {enviando ? "Salvando…" : "Registrar despesa"}
          </button>
          {erro && <span className="text-sm text-danger">{erro}</span>}
        </div>
      </form>

      {despesas.length > 0 && (
        <ul className="space-y-2 border-t border-border pt-4">
          {despesas.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {d.description}
                  {d.recurring && (
                    <span className="ml-2 text-xs text-subtle">· fixo mensal</span>
                  )}
                </p>
                <p className="text-xs text-subtle">
                  {dataCurta.format(d.spentAt)} · {d.createdBy.name ?? d.createdBy.email}
                </p>
              </div>
              <Badge>{ROTULO_CATEGORIA_DESPESA[d.category] ?? d.category}</Badge>
              <span className="shrink-0 text-sm font-medium tabular-nums text-danger">
                {formatarCentavos(d.amountCents)}
              </span>
              <button
                type="button"
                onClick={() => remover(d.id)}
                disabled={enviando}
                title="Excluir despesa"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-danger-subtle hover:text-danger disabled:opacity-50"
              >
                <IconTrash className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
