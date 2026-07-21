"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/features/auth/current-user";
import { can, podeAcessarPainel } from "@/features/auth/permissions";

/** Marca a tarefa como concluída (só o responsável pode). */
export async function completeTask(taskId: string) {
  const user = await requireCapability("crm.manage");

  // filtra pelo dono na própria query: sem isso, um POST direto concluiria
  // tarefa de outra pessoa
  const resultado = await prisma.task.updateMany({
    where: { id: taskId, assignedToId: user.id },
    data: { status: "DONE", doneAt: new Date() },
  });

  if (resultado.count === 0) throw new Error("Tarefa não encontrada");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routine");
}

export async function createTask(formData: FormData) {
  const user = await requireCapability("crm.manage");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Título é obrigatório");

  const dueRaw = String(formData.get("dueAt") ?? "").trim();
  const dueAt = dueRaw ? new Date(dueRaw) : new Date();
  if (Number.isNaN(dueAt.getTime())) throw new Error("Data inválida");

  const contactId = String(formData.get("contactId") ?? "").trim() || null;
  const kindRaw = String(formData.get("kind") ?? "OTHER");
  const kind = ["FOLLOW_UP", "CALL", "PROPOSAL", "OTHER"].includes(kindRaw)
    ? (kindRaw as "FOLLOW_UP" | "CALL" | "PROPOSAL" | "OTHER")
    : "OTHER";

  // Responsável: por padrão quem está criando. Atribuir a OUTRA pessoa exige
  // permissão — sem isso, qualquer colaborador criaria tarefa no nome dos
  // colegas (o select escondido na UI não protege o endpoint).
  const alvo = String(formData.get("assignedToId") ?? "").trim();
  let assignedToId = user.id;

  if (alvo && alvo !== user.id) {
    if (!can(user.role, "tasks.assign")) {
      throw new Error("Você não pode atribuir tarefas a outra pessoa");
    }
    const destinatario = await prisma.user.findUnique({ where: { id: alvo } });
    if (!destinatario) throw new Error("Pessoa não encontrada");
    if (!podeAcessarPainel(destinatario.role)) {
      throw new Error("Essa pessoa não tem acesso ao painel");
    }
    assignedToId = alvo;
  }

  await prisma.task.create({
    data: {
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      kind,
      dueAt,
      contactId,
      assignedToId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routine");
}

/**
 * Cria uma tarefa de follow-up a partir de um lead parado (a sugestão da
 * rotina vira compromisso de verdade).
 */
export async function createFollowUp(contactId: string) {
  const user = await requireCapability("crm.manage");

  const contato = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contato) throw new Error("Contato não encontrado");

  await prisma.task.create({
    data: {
      title: `Retomar contato com ${contato.name}`,
      kind: "FOLLOW_UP",
      dueAt: new Date(),
      contactId,
      assignedToId: user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routine");
}
