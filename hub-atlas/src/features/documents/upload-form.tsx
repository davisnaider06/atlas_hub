"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/field";
import { IconPlus } from "@/components/ui/icons";
import { uploadDocument } from "./actions";
import { ROTULO_CATEGORIA } from "./labels";

/**
 * Envio de documento.
 *
 * Cliente por causa do feedback: upload demora e falha por motivos banais
 * (tamanho, formato). Sem estado visível a pessoa clica de novo achando que
 * não funcionou.
 */
export function UploadForm({
  contactId,
  contatos,
}: {
  /** Fixa o documento num contato (usado na tela do lead). */
  contactId?: string;
  /** Lista pra escolher o contato (usado na tela central). */
  contatos?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ erro?: string; ok?: boolean } | null>(null);

  function enviar(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      const r = await uploadDocument(formData);
      if (r.ok) {
        setMsg({ ok: true });
        formRef.current?.reset();
        router.refresh();
      } else {
        setMsg({ erro: r.erro });
      }
    });
  }

  return (
    <form ref={formRef} action={enviar} className="grid gap-4 sm:grid-cols-6">
      {contactId && <input type="hidden" name="contactId" value={contactId} />}

      <div className="sm:col-span-3">
        <label className="mb-1.5 block text-sm font-medium" htmlFor="file">
          Arquivo <span className="text-brand">*</span>
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          className="w-full rounded-xl border border-border bg-surface-sunken/60 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-fg"
        />
      </div>

      <div className="sm:col-span-3">
        <label className="mb-1.5 block text-sm font-medium" htmlFor="title">
          Título
        </label>
        <input
          id="title"
          name="title"
          placeholder="Ex: Escopo padrão de automação"
          className={fieldClasses}
        />
      </div>

      <div className={contatos ? "sm:col-span-2" : "sm:col-span-3"}>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="category">
          Categoria
        </label>
        <select id="category" name="category" defaultValue="OTHER" className={fieldClasses}>
          {Object.entries(ROTULO_CATEGORIA).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {contatos && (
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="contactId">
            Vincular a
          </label>
          <select id="contactId" name="contactId" defaultValue="" className={fieldClasses}>
            <option value="">Documento da Atlas (interno)</option>
            {contatos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={contatos ? "sm:col-span-2" : "sm:col-span-3"}>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="description">
          Descrição
        </label>
        <input
          id="description"
          name="description"
          placeholder="Opcional"
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
          {enviando ? "Enviando…" : "Enviar documento"}
        </button>
        {msg?.erro && <span className="text-sm text-danger">{msg.erro}</span>}
        {msg?.ok && <span className="text-sm text-success">Documento enviado.</span>}
      </div>
    </form>
  );
}
