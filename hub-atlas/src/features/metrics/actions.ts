"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/features/auth/current-user";
import { paraCentavos } from "@/features/crm/money";

/** Define meta de vendas do mês e % de comissão de um SDR. */
export async function setSalesGoal(userId: string, formData: FormData) {
  await requireCapability("metrics.view");

  const target = paraCentavos(formData.get("target"));
  if (target == null || target < 0) throw new Error("Meta inválida");

  const pctRaw = String(formData.get("commission") ?? "").trim();
  let commissionPercent: number | null = null;
  if (pctRaw) {
    const n = Number(pctRaw.replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      throw new Error("Comissão deve ser entre 0 e 100");
    }
    commissionPercent = Math.round(n);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { salesTargetCents: target, commissionPercent },
  });

  revalidatePath("/dashboard/metrics");
}
