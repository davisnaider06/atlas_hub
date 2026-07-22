"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireCapability } from "@/features/auth/current-user";
import { pullFromGoogle } from "./sync";
import { listCalendars } from "./calendar";

/** Desconecta a agenda do usuário logado.
 *  Os eventos já criados no Google permanecem lá — só paramos de sincronizar. */
export async function disconnectGoogle() {
  const user = await requireAdmin();
  await prisma.googleAccount.deleteMany({ where: { userId: user.id } });
  revalidatePath("/dashboard/settings");
}

/**
 * Escolhe qual agenda do Google o Hub usa.
 *
 * Zera o syncToken: ele é específico da agenda anterior, e reaproveitá-lo faria
 * o Google recusar (410) ou devolver o delta da agenda errada. Com o token
 * nulo, a próxima sincronização faz carga completa da nova agenda.
 */
export async function setCalendar(calendarId: string) {
  const user = await requireCapability("appointments.manage");

  // só aceita uma agenda em que a pessoa realmente pode escrever
  const disponiveis = await listCalendars(user.id);
  if (!disponiveis.some((c) => c.id === calendarId)) {
    throw new Error("Agenda inválida");
  }

  await prisma.googleAccount.update({
    where: { userId: user.id },
    data: { calendarId, syncToken: null },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/appointments");
}

/**
 * Puxa do Google o que mudou na agenda Atlas.
 *
 * Chamada ao abrir a tela de agendamentos e pelo botão "Sincronizar". Nunca
 * lança: se o Google estiver fora ou a conta desconectada, a tela continua
 * mostrando o que já existe no Hub.
 */
export async function syncFromGoogle() {
  const user = await requireAdmin();

  const resultado = await pullFromGoogle(user.id).catch((e) => ({
    ok: false as const,
    criados: 0,
    atualizados: 0,
    removidos: 0,
    motivo: e instanceof Error ? e.message : "erro desconhecido",
  }));

  if (resultado.criados || resultado.atualizados || resultado.removidos) {
    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard");
    revalidatePath("/portal");
  }

  return resultado;
}
