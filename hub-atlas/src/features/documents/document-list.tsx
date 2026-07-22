"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/field";
import { IconDocuments, IconTrash } from "@/components/ui/icons";
import { deleteDocument } from "./actions";
import { ROTULO_CATEGORIA, formatarTamanho } from "./labels";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type Doc = {
  id: string;
  fileName: string;
  title: string | null;
  description: string | null;
  category: string;
  sizeBytes: number;
  createdAt: Date;
  uploadedBy: { name: string | null; email: string };
  contact?: { id: string; name: string } | null;
};

export function DocumentList({
  documentos,
  mostrarContato = false,
}: {
  documentos: Doc[];
  mostrarContato?: boolean;
}) {
  const router = useRouter();
  const [removendo, startTransition] = useTransition();

  function remover(d: Doc) {
    if (!confirm(`Excluir "${d.title ?? d.fileName}"? Essa ação não pode ser desfeita.`))
      return;
    startTransition(async () => {
      await deleteDocument(d.id);
      router.refresh();
    });
  }

  return (
    <ul className="space-y-2">
      {documentos.map((d) => (
        <li
          key={d.id}
          className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-surface-hover"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
            <IconDocuments className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            {/* abre em nova aba: PDF e imagem são exibidos direto pelo navegador */}
            <a
              href={`/api/documents/${d.id}`}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm font-medium hover:text-brand"
            >
              {d.title ?? d.fileName}
            </a>
            <p className="truncate text-xs text-subtle">
              {formatarTamanho(d.sizeBytes)} · {dataCurta.format(d.createdAt)} ·{" "}
              {d.uploadedBy.name ?? d.uploadedBy.email}
              {d.description ? ` · ${d.description}` : ""}
            </p>
          </div>

          {mostrarContato && d.contact && (
            <Link
              href={`/dashboard/leads/${d.contact.id}`}
              className="shrink-0 text-xs text-muted hover:text-brand"
            >
              {d.contact.name}
            </Link>
          )}

          <Badge>{ROTULO_CATEGORIA[d.category] ?? d.category}</Badge>

          <button
            type="button"
            onClick={() => remover(d)}
            disabled={removendo}
            title="Excluir documento"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-danger-subtle hover:text-danger disabled:opacity-50"
          >
            <IconTrash className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
