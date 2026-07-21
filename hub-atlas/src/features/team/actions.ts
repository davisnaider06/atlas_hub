"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireCapability } from "@/features/auth/current-user";
import { PAPEIS_ATRIBUIVEIS } from "@/features/auth/permissions";
import type { Role } from "@/generated/prisma/enums";

function papelValido(valor: FormDataEntryValue | null): Role {
  const v = String(valor ?? "");
  if (!PAPEIS_ATRIBUIVEIS.includes(v as Role)) {
    throw new Error("Papel inválido");
  }
  return v as Role;
}

/**
 * Pré-cadastra alguém. A pessoa ainda não existe no Clerk: criamos o registro
 * com clerkId nulo e, no primeiro login com o Google, ele é casado por email
 * (ver getCurrentUser) já com o papel definido aqui.
 */
export async function inviteMember(formData: FormData) {
  const autor = await requireCapability("team.manage");

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Email inválido");

  const role = papelValido(formData.get("role"));
  const name = String(formData.get("name") ?? "").trim() || null;

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) throw new Error("Já existe alguém com esse email");

  await prisma.user.create({
    data: { email, name, role, invitedBy: autor.id },
  });

  revalidatePath("/dashboard/team");
}

export async function updateMemberRole(userId: string, formData: FormData) {
  const autor = await requireCapability("team.manage");
  const role = papelValido(formData.get("role"));

  // Evita o tiro no pé: rebaixar a si mesmo deixaria a instalação sem ninguém
  // capaz de gerenciar a equipe.
  if (userId === autor.id && role !== "OWNER") {
    throw new Error("Você não pode rebaixar a si mesmo");
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/dashboard/team");
}

export async function removeMember(userId: string) {
  const autor = await requireCapability("team.manage");
  if (userId === autor.id) throw new Error("Você não pode remover a si mesmo");

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/dashboard/team");
}

/** Usado pelas telas pra saber o que mostrar. */
export async function getUsuarioAtual() {
  return getCurrentUser();
}
