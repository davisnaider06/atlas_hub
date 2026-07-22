"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/features/auth/current-user";
import {
  TAMANHO_MAXIMO,
  apagarArquivo,
  nomeSeguro,
  salvarArquivo,
  tipoPermitido,
} from "./storage";
import type { DocumentCategory } from "@/generated/prisma/enums";

const CATEGORIAS = [
  "SCRIPT",
  "PLANNING",
  "SCOPE",
  "CONTRACT",
  "PROPOSAL",
  "OTHER",
] as const;

function categoriaValida(v: FormDataEntryValue | null): DocumentCategory {
  const s = String(v ?? "OTHER");
  return (CATEGORIAS as readonly string[]).includes(s)
    ? (s as DocumentCategory)
    : "OTHER";
}

function opcional(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s.length > 0 ? s : null;
}

/**
 * Envia um documento. `contactId` vazio = documento interno da Atlas.
 *
 * Retorna o erro em vez de lançar: upload falha por motivos banais (arquivo
 * grande, formato) e o usuário precisa ver o porquê, não uma tela de erro.
 */
export async function uploadDocument(formData: FormData) {
  const user = await requireCapability("crm.manage");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, erro: "Selecione um arquivo." };
  }

  if (file.size > TAMANHO_MAXIMO) {
    const mb = (TAMANHO_MAXIMO / 1024 / 1024).toFixed(0);
    return { ok: false as const, erro: `Arquivo maior que ${mb} MB.` };
  }

  if (!tipoPermitido(file.type)) {
    return {
      ok: false as const,
      erro: `Formato não aceito (${file.type || "desconhecido"}).`,
    };
  }

  const contactId = opcional(formData.get("contactId"));

  // vínculo inválido criaria documento órfão, invisível nas duas telas
  if (contactId) {
    const existe = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!existe) return { ok: false as const, erro: "Contato não encontrado." };
  }

  const storageKey = await salvarArquivo(file);

  await prisma.document.create({
    data: {
      fileName: nomeSeguro(file.name),
      title: opcional(formData.get("title")),
      description: opcional(formData.get("description")),
      storageKey,
      mimeType: file.type,
      sizeBytes: file.size,
      scope: contactId ? "CONTACT" : "INTERNAL",
      category: categoriaValida(formData.get("category")),
      contactId,
      uploadedById: user.id,
    },
  });

  revalidatePath("/dashboard/documents");
  if (contactId) {
    revalidatePath(`/dashboard/leads/${contactId}`);
    revalidatePath("/portal");
  }

  return { ok: true as const };
}

export async function deleteDocument(id: string) {
  await requireCapability("crm.manage");

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return;

  // banco primeiro: se a remoção do arquivo falhar, sobra um órfão no disco —
  // bem menos grave do que um registro apontando pra arquivo inexistente
  await prisma.document.delete({ where: { id } });
  await apagarArquivo(doc.storageKey);

  revalidatePath("/dashboard/documents");
  if (doc.contactId) {
    revalidatePath(`/dashboard/leads/${doc.contactId}`);
    revalidatePath("/portal");
  }
}
