import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/field";
import { IconDocuments } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/current-user";
import { can } from "@/features/auth/permissions";
import { getContacts } from "@/features/crm/queries";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/features/documents/document-list";
import { UploadForm } from "@/features/documents/upload-form";
import { ROTULO_CATEGORIA } from "@/features/documents/labels";
import { getInternalCounts } from "@/features/documents/queries";
import type { DocumentCategory } from "@/generated/prisma/enums";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; aba?: string }>;
}) {
  const eu = await getCurrentUser();
  if (!can(eu?.role, "crm.view")) notFound();

  const { cat, aba } = await searchParams;
  const verClientes = aba === "clientes";
  const categoria =
    cat && cat in ROTULO_CATEGORIA ? (cat as DocumentCategory) : undefined;

  const [internos, deClientes, contatos, contagens] = await Promise.all([
    verClientes
      ? Promise.resolve([])
      : prisma.document.findMany({
          where: { scope: "INTERNAL", ...(categoria ? { category: categoria } : {}) },
          include: { uploadedBy: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        }),
    verClientes
      ? prisma.document.findMany({
          where: { scope: "CONTACT" },
          include: {
            uploadedBy: { select: { name: true, email: true } },
            contact: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    getContacts(),
    getInternalCounts(),
  ]);

  const totalInternos = Object.values(contagens).reduce((s, n) => s + n, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Documentos</h1>
        <p className="mt-1 text-sm text-muted">
          Materiais da Atlas e arquivos vinculados a leads e clientes.
        </p>
      </div>

      {/* abas */}
      <div className="flex w-fit rounded-full border border-border p-0.5">
        <Link
          href="/dashboard/documents"
          className={
            verClientes
              ? "rounded-full px-3.5 py-1.5 text-sm text-muted hover:text-text"
              : "rounded-full bg-brand-subtle px-3.5 py-1.5 text-sm font-medium text-brand"
          }
        >
          Da Atlas
        </Link>
        <Link
          href="/dashboard/documents?aba=clientes"
          className={
            verClientes
              ? "rounded-full bg-brand-subtle px-3.5 py-1.5 text-sm font-medium text-brand"
              : "rounded-full px-3.5 py-1.5 text-sm text-muted hover:text-text"
          }
        >
          De clientes
        </Link>
      </div>

      <Card className="p-5">
        <CardHeading label="Enviar" title="Novo documento" />
        <div className="mt-4">
          <UploadForm contatos={contatos.map((c) => ({ id: c.id, name: c.name }))} />
        </div>
      </Card>

      {verClientes ? (
        <Card className="p-5">
          <CardHeading
            label={`${deClientes.length} ${deClientes.length === 1 ? "arquivo" : "arquivos"}`}
            title="Documentos de clientes"
          />
          {deClientes.length === 0 ? (
            <EmptyState
              icon={<IconDocuments className="size-6" />}
              title="Nenhum documento de cliente"
              description="Envie um arquivo acima escolhendo a quem ele pertence."
            />
          ) : (
            <div className="mt-4">
              <DocumentList documentos={deClientes} mostrarContato />
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-5">
          <CardHeading
            label={`${totalInternos} ${totalInternos === 1 ? "arquivo" : "arquivos"}`}
            title="Materiais da Atlas"
          />

          {/* filtro por categoria */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Link
              href="/dashboard/documents"
              className={
                categoria
                  ? "rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-surface-hover"
                  : "rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand"
              }
            >
              Todos
            </Link>
            {Object.entries(ROTULO_CATEGORIA).map(([valor, rotulo]) => (
              <Link
                key={valor}
                href={`/dashboard/documents?cat=${valor}`}
                className={
                  categoria === valor
                    ? "rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand"
                    : "rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-surface-hover"
                }
              >
                {rotulo}
                {contagens[valor] ? ` (${contagens[valor]})` : ""}
              </Link>
            ))}
          </div>

          {internos.length === 0 ? (
            <EmptyState
              icon={<IconDocuments className="size-6" />}
              title={categoria ? "Nada nesta categoria" : "Nenhum material ainda"}
              description="Centralize aqui scripts, planejamentos e escopos de serviço."
            />
          ) : (
            <div className="mt-4">
              <DocumentList documentos={internos} />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
