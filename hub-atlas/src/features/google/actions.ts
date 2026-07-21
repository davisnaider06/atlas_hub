"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/features/auth/current-user";

/** Desconecta a agenda do usuário logado.
 *  Os eventos já criados no Google permanecem lá — só paramos de sincronizar. */
export async function disconnectGoogle() {
  const user = await requireAdmin();
  await prisma.googleAccount.deleteMany({ where: { userId: user.id } });
  revalidatePath("/dashboard/settings");
}
