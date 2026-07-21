"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/features/auth/current-user";
import {
  removeAppointmentFromGoogle,
  syncAppointmentToGoogle,
} from "@/features/google/calendar";

function optionalString(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: FormDataEntryValue | null, campo: string) {
  const v = optionalString(value);
  if (!v) throw new Error(`${campo} é obrigatório`);
  return v;
}

function appointmentDataFromForm(formData: FormData) {
  const title = requiredString(formData.get("title"), "Título");
  const contactId = requiredString(formData.get("contactId"), "Contato");
  const assignedToId = requiredString(formData.get("assignedToId"), "Atendente");
  const startsAtRaw = requiredString(formData.get("startsAt"), "Início");
  const duracao = Number(formData.get("durationMinutes") ?? 60);

  // `datetime-local` chega sem fuso; o Date do servidor interpreta no fuso dele,
  // que é o mesmo usado pra exibir depois — então ida e volta são consistentes.
  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Data de início inválida");

  if (!Number.isFinite(duracao) || duracao <= 0) {
    throw new Error("Duração inválida");
  }

  const endsAt = new Date(startsAt.getTime() + duracao * 60_000);

  return {
    title,
    contactId,
    assignedToId,
    startsAt,
    endsAt,
    notes: optionalString(formData.get("notes")),
  };
}

function revalidarTudo(id?: string) {
  revalidatePath("/dashboard/appointments");
  if (id) revalidatePath(`/dashboard/appointments/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/portal");
}

export async function createAppointment(formData: FormData) {
  await requireAdmin();
  const data = appointmentDataFromForm(formData);

  const appointment = await prisma.appointment.create({ data });

  // espelha no Google Calendar do atendente. Se falhar (atendente não conectou,
  // API fora), o agendamento continua válido no Hub — o Google é só espelho.
  await syncAppointmentToGoogle(appointment.id);

  revalidarTudo(appointment.id);
  redirect("/dashboard/appointments");
}

export async function updateAppointment(id: string, formData: FormData) {
  await requireAdmin();
  const data = appointmentDataFromForm(formData);

  await prisma.appointment.update({ where: { id }, data });
  await syncAppointmentToGoogle(id);

  revalidarTudo(id);
  redirect("/dashboard/appointments");
}

/** Cancela sem apagar — mantém o histórico do que foi marcado. */
export async function cancelAppointment(id: string) {
  await requireAdmin();

  // tira do Google antes de marcar cancelado (precisa do googleEventId)
  await removeAppointmentFromGoogle(id);
  await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELED" },
  });

  revalidarTudo(id);
  redirect("/dashboard/appointments");
}

export async function completeAppointment(id: string) {
  await requireAdmin();
  await prisma.appointment.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  revalidarTudo(id);
  redirect("/dashboard/appointments");
}

export async function deleteAppointment(id: string) {
  await requireAdmin();

  await removeAppointmentFromGoogle(id);
  await prisma.appointment.delete({ where: { id } });

  revalidarTudo();
  redirect("/dashboard/appointments");
}
