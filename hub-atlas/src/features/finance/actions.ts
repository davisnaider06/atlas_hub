"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/features/auth/current-user";
import { paraCentavos } from "@/features/crm/money";
import { dividirValor, gerarVencimentos } from "./installments";
import type { ContractType, ExpenseCategory } from "@/generated/prisma/enums";

function opcional(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s.length > 0 ? s : null;
}

/** "2026-08-15" -> Date local ao meio-dia (evita o pulo de fuso do input date). */
function dataDoInput(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

function revalidar(contactId?: string) {
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  if (contactId) revalidatePath(`/dashboard/leads/${contactId}`);
}

/**
 * Cria um contrato e gera as parcelas de uma vez.
 *
 * ONE_OFF: total dividido em N parcelas (a soma bate exato — ver dividirValor).
 * RECURRING: N mensalidades de valor fixo. Geramos um horizonte de meses; dá
 * pra estender depois sem cron.
 */
export async function createContract(formData: FormData) {
  const user = await requireCapability("finance.manage");

  const contactId = opcional(formData.get("contactId"));
  if (!contactId) throw new Error("Cliente é obrigatório");
  const cliente = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!cliente) throw new Error("Cliente não encontrado");

  const tipoRaw = String(formData.get("type") ?? "");
  if (tipoRaw !== "ONE_OFF" && tipoRaw !== "RECURRING") {
    throw new Error("Tipo de contrato inválido");
  }
  const type = tipoRaw as ContractType;

  const primeiroVenc = dataDoInput(formData.get("firstDueDate"));
  if (!primeiroVenc) throw new Error("Data do primeiro vencimento inválida");

  let totalCents: number | null = null;
  let monthlyCents: number | null = null;
  let valores: number[];

  if (type === "ONE_OFF") {
    const total = paraCentavos(formData.get("totalValue"));
    if (!total || total <= 0) throw new Error("Valor total inválido");
    const n = Number(formData.get("installmentsCount") ?? 1);
    if (!Number.isInteger(n) || n < 1 || n > 120) {
      throw new Error("Número de parcelas inválido");
    }
    totalCents = total;
    valores = dividirValor(total, n);
  } else {
    const mensal = paraCentavos(formData.get("monthlyValue"));
    if (!mensal || mensal <= 0) throw new Error("Valor mensal inválido");
    const meses = Number(formData.get("monthsToGenerate") ?? 12);
    if (!Number.isInteger(meses) || meses < 1 || meses > 120) {
      throw new Error("Número de meses inválido");
    }
    monthlyCents = mensal;
    valores = Array<number>(meses).fill(mensal);
  }

  const vencimentos = gerarVencimentos(primeiroVenc, valores.length);

  await prisma.contract.create({
    data: {
      title: opcional(formData.get("title")),
      type,
      totalCents,
      monthlyCents,
      notes: opcional(formData.get("notes")),
      contactId,
      serviceId: opcional(formData.get("serviceId")),
      installments: {
        create: valores.map((amountCents, i) => ({
          number: i + 1,
          amountCents,
          dueDate: vencimentos[i],
        })),
      },
    },
  });

  // registra quem criou fica implícito; contratos não guardam autor por ora
  void user;
  revalidar(contactId);
}

export async function markInstallmentPaid(id: string) {
  await requireCapability("finance.manage");
  const parc = await prisma.installment.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
    select: { contract: { select: { contactId: true } } },
  });
  revalidar(parc.contract.contactId);
}

export async function markInstallmentPending(id: string) {
  await requireCapability("finance.manage");
  const parc = await prisma.installment.update({
    where: { id },
    data: { status: "PENDING", paidAt: null },
    select: { contract: { select: { contactId: true } } },
  });
  revalidar(parc.contract.contactId);
}

export async function deleteContract(id: string) {
  await requireCapability("finance.manage");
  const c = await prisma.contract.findUnique({ where: { id } });
  // as parcelas somem junto (onDelete: Cascade)
  await prisma.contract.delete({ where: { id } });
  revalidar(c?.contactId);
}

/* ----------------------------- despesas (só sócio) ----------------------------- */

const CATEGORIAS = [
  "PAYROLL",
  "TOOLS",
  "MARKETING",
  "INFRA",
  "TAXES",
  "OTHER",
] as const;

export async function createExpense(formData: FormData) {
  const user = await requireCapability("finance.expenses");

  const description = String(formData.get("description") ?? "").trim();
  if (!description) throw new Error("Descrição é obrigatória");

  const amountCents = paraCentavos(formData.get("amount"));
  if (!amountCents || amountCents <= 0) throw new Error("Valor inválido");

  const spentAt = dataDoInput(formData.get("spentAt")) ?? new Date();
  const catRaw = String(formData.get("category") ?? "OTHER");
  const category = (CATEGORIAS as readonly string[]).includes(catRaw)
    ? (catRaw as ExpenseCategory)
    : "OTHER";

  await prisma.expense.create({
    data: {
      description,
      amountCents,
      category,
      spentAt,
      recurring: formData.get("recurring") !== null,
      notes: opcional(formData.get("notes")),
      createdById: user.id,
    },
  });

  revalidatePath("/dashboard/finance");
}

export async function deleteExpense(id: string) {
  await requireCapability("finance.expenses");
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/dashboard/finance");
}
