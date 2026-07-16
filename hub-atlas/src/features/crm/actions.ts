"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/features/auth/current-user";

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
  };
}

export async function createContact(formData: FormData) {
  await requireAdmin();
  const data = contactDataFromForm(formData);

  const contact = await prisma.contact.create({ data });

  revalidatePath("/dashboard/contacts");
  revalidatePath("/dashboard/pipeline");
  redirect(`/dashboard/contacts/${contact.id}`);
}

export async function updateContact(id: string, formData: FormData) {
  await requireAdmin();
  const data = contactDataFromForm(formData);

  await prisma.contact.update({ where: { id }, data });

  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${id}`);
  revalidatePath("/dashboard/pipeline");
  redirect(`/dashboard/contacts/${id}`);
}

export async function deleteContact(id: string) {
  await requireAdmin();
  await prisma.contact.delete({ where: { id } });

  revalidatePath("/dashboard/contacts");
  revalidatePath("/dashboard/pipeline");
  redirect("/dashboard/contacts");
}

export async function moveContact(contactId: string, stageId: string) {
  await requireAdmin();
  await prisma.contact.update({ where: { id: contactId }, data: { stageId } });

  revalidatePath("/dashboard/pipeline");
}
