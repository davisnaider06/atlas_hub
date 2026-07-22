import { prisma } from "@/lib/prisma";
import type { DocumentCategory } from "@/generated/prisma/enums";

const incluiAutor = {
  uploadedBy: { select: { name: true, email: true } },
} as const;

/** Documentos internos da Atlas (scripts, planejamentos, escopos). */
export function getInternalDocuments(categoria?: DocumentCategory) {
  return prisma.document.findMany({
    where: { scope: "INTERNAL", ...(categoria ? { category: categoria } : {}) },
    include: incluiAutor,
    orderBy: { createdAt: "desc" },
  });
}

/** Documentos de um lead/cliente específico. */
export function getContactDocuments(contactId: string) {
  return prisma.document.findMany({
    where: { scope: "CONTACT", contactId },
    include: incluiAutor,
    orderBy: { createdAt: "desc" },
  });
}

export function getDocumentById(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { ...incluiAutor, contact: { select: { id: true, name: true } } },
  });
}

/** Quantos documentos há em cada categoria — usado nos filtros. */
export async function getInternalCounts() {
  const linhas = await prisma.document.groupBy({
    by: ["category"],
    where: { scope: "INTERNAL" },
    _count: { _all: true },
  });
  return Object.fromEntries(linhas.map((l) => [l.category, l._count._all])) as Record<
    string,
    number
  >;
}

export type DocumentListItem = Awaited<ReturnType<typeof getInternalDocuments>>[number];
