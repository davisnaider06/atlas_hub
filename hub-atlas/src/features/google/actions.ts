"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/features/auth/current-user";
import { pullFromGoogle } from "./sync";

/** Desconecta a agenda do usuário logado.
 *  Os eventos já criados no Google permanecem lá — só paramos de sincronizar. */
export async function disconnectGoogle() {
  const user = await requireAdmin();
  await prisma.googleAccount.deleteMany({ where: { userId: user.id } });
  revalidatePath("/dashboard/settings");
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
