"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/features/auth/current-user";
import { paraCentavos } from "@/features/crm/money";

function optionalString(value: FormDataEntryValue | null) {
  const t = String(value ?? "").trim();
  return t.length > 0 ? t : null;
}

function dadosDoForm(formData: FormData) {
  const name = optionalString(formData.get("name"));
  if (!name) throw new Error("Nome do serviço é obrigatório");

  const priceMinCents = paraCentavos(formData.get("priceMin"));
  const priceMaxCents = paraCentavos(formData.get("priceMax"));

  // piso maior que teto quase sempre é troca acidental dos campos
  if (priceMinCents !== null && priceMaxCents !== null && priceMinCents > priceMaxCents) {
    throw new Error("O valor mínimo não pode ser maior que o máximo");
  }

  return {
    name,
    description: optionalString(formData.get("description")),
    priceMinCents,
    priceMaxCents,
    active: formData.get("active") !== null,
  };
}

function revalidar(id?: string) {
  revalidatePath("/dashboard/services");
  if (id) revalidatePath(`/dashboard/services/${id}`);
  revalidatePath("/dashboard/clients");
}

export async function createService(formData: FormData) {
  await requireCapability("services.manage");
  const data = dadosDoForm(formData);
  await prisma.service.create({ data });
  revalidar();
  redirect("/dashboard/services");
}

export async function updateService(id: string, formData: FormData) {
  await requireCapability("services.manage");
  const data = dadosDoForm(formData);
  await prisma.service.update({ where: { id }, data });
  revalidar(id);
  redirect("/dashboard/services");
}

/**
 * Exclui o serviço. Clientes que o contrataram ficam com serviceId nulo
 * (ON DELETE SET NULL) — o histórico do cliente não é perdido.
 */
export async function deleteService(id: string) {
  await requireCapability("services.manage");
  await prisma.service.delete({ where: { id } });
  revalidar();
  redirect("/dashboard/services");
}
