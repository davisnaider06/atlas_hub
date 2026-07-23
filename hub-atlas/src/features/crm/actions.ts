"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/features/auth/current-user";
import { tipoParaEstagio } from "./stage-rules";
import { paraCentavos } from "./money";

function optionalString(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function contactDataFromForm(formData: FormData) {
  const name = optionalString(formData.get("name"));
  const stageId = optionalString(formData.get("stageId"));
  if (!name) throw new Error("Nome é obrigatório");
  if (!stageId) throw new Error("Estágio é obrigatório");

  return {
    name,
    stageId,
    email: optionalString(formData.get("email")),
    phone: optionalString(formData.get("phone")),
    company: optionalString(formData.get("company")),
    notes: optionalString(formData.get("notes")),
    // só aparecem no formulário quando o estágio é de ganho
    serviceId: optionalString(formData.get("serviceId")),
    contractValueCents: paraCentavos(formData.get("contractValue")),
  };
}

/** Revalida tudo que exibe contatos (leads, clientes, pipeline, painel). */
function revalidarCrm(id?: string) {
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/dashboard/leads/${id}`);
}

export async function createContact(formData: FormData) {
  const user = await requireAdmin();
  const data = contactDataFromForm(formData);
  const type = await tipoParaEstagio(data.stageId);

  // quem cria o lead vira o SDR responsável (base das métricas por pessoa)
  const contact = await prisma.contact.create({
    data: { ...data, type, ownerId: user.id },
  });

  revalidarCrm(contact.id);
  redirect(`/dashboard/leads/${contact.id}`);
}

/** Reatribui o lead a outro SDR. Não vem do formulário de edição pra evitar
 *  trocar o dono sem querer ao salvar outros campos. */
export async function reassignOwner(contactId: string, ownerId: string) {
  await requireAdmin();

  const alvo = ownerId
    ? await prisma.user.findUnique({ where: { id: ownerId } })
    : null;
  // string vazia = remover dono; id inválido é rejeitado
  if (ownerId && !alvo) throw new Error("Responsável inválido");

  await prisma.contact.update({
    where: { id: contactId },
    data: { ownerId: ownerId || null },
  });

  revalidarCrm(contactId);
}

export async function updateContact(id: string, formData: FormData) {
  await requireAdmin();
  const data = contactDataFromForm(formData);
  // mudar o estágio pra "Fechado - Ganho" promove o lead a cliente (e o
  // caminho inverso rebaixa, caso o negócio seja reaberto)
  const type = await tipoParaEstagio(data.stageId);

  await prisma.contact.update({ where: { id }, data: { ...data, type } });

  revalidarCrm(id);
  redirect(`/dashboard/leads/${id}`);
}

export async function deleteContact(id: string) {
  await requireAdmin();
  await prisma.contact.delete({ where: { id } });

  revalidarCrm();
  redirect("/dashboard/leads");
}

export async function moveContact(contactId: string, stageId: string) {
  await requireAdmin();
  // mesma promoção do formulário — senão arrastar no kanban não converteria
  const type = await tipoParaEstagio(stageId);

  await prisma.contact.update({
    where: { id: contactId },
    data: { stageId, type },
  });

  revalidarCrm(contactId);
}
