import { prisma } from "@/lib/prisma";
import { statusEfetivo } from "./installments";

const incluiCliente = {
  contract: {
    select: {
      id: true,
      title: true,
      type: true,
      contact: { select: { id: true, name: true } },
    },
  },
} as const;

/** Resumo do topo do financeiro. Deriva "atrasado" na hora (não é campo). */
export async function getFinanceSummary() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const em30dias = new Date(hoje.getTime() + 30 * 86_400_000);

  const [pendentes, pagasNoMes, recorrentes] = await Promise.all([
    prisma.installment.findMany({
      where: { status: "PENDING" },
      select: { amountCents: true, dueDate: true },
    }),
    prisma.installment.findMany({
      where: { status: "PAID", paidAt: { gte: inicioMes } },
      select: { amountCents: true },
    }),
    prisma.contract.findMany({
      where: { type: "RECURRING", status: "ACTIVE" },
      select: { monthlyCents: true },
    }),
  ]);

  let atrasado = 0;
  let aReceber = 0;
  let proximos30 = 0;
  for (const p of pendentes) {
    if (statusEfetivo("PENDING", p.dueDate, hoje) === "OVERDUE") {
      atrasado += p.amountCents;
    } else {
      aReceber += p.amountCents;
      if (p.dueDate <= em30dias) proximos30 += p.amountCents;
    }
  }

  return {
    recebidoMes: pagasNoMes.reduce((s, p) => s + p.amountCents, 0),
    aReceber,
    atrasado,
    proximos30,
    mrr: recorrentes.reduce((s, c) => s + (c.monthlyCents ?? 0), 0),
  };
}

/** Parcelas em aberto (a receber + atrasadas), da mais próxima pra frente. */
export async function getReceivables() {
  const parcelas = await prisma.installment.findMany({
    where: { status: "PENDING" },
    include: incluiCliente,
    orderBy: { dueDate: "asc" },
    take: 200,
  });
  return parcelas.map((p) => ({ ...p, efetivo: statusEfetivo("PENDING", p.dueDate) }));
}

/** Contratos com progresso de pagamento. */
export async function getContracts() {
  const contratos = await prisma.contract.findMany({
    include: {
      contact: { select: { id: true, name: true } },
      service: { select: { name: true } },
      installments: { select: { amountCents: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return contratos.map((c) => {
    const total = c.installments.reduce((s, i) => s + i.amountCents, 0);
    const pago = c.installments
      .filter((i) => i.status === "PAID")
      .reduce((s, i) => s + i.amountCents, 0);
    return { ...c, totalParcelado: total, pago };
  });
}

/** Contratos de um cliente, com as parcelas — usado na tela do cliente. */
export async function getClientContracts(contactId: string) {
  const contratos = await prisma.contract.findMany({
    where: { contactId },
    include: {
      service: { select: { name: true } },
      installments: { orderBy: { number: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return contratos.map((c) => ({
    ...c,
    installments: c.installments.map((i) => ({
      ...i,
      efetivo: statusEfetivo(i.status, i.dueDate),
    })),
  }));
}

export async function getExpenses() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [despesas, doMes, fixas] = await Promise.all([
    prisma.expense.findMany({
      include: { createdBy: { select: { name: true, email: true } } },
      orderBy: { spentAt: "desc" },
      take: 200,
    }),
    prisma.expense.aggregate({
      _sum: { amountCents: true },
      where: { spentAt: { gte: inicioMes } },
    }),
    prisma.expense.aggregate({ _sum: { amountCents: true }, where: { recurring: true } }),
  ]);

  return {
    despesas,
    totalMes: doMes._sum.amountCents ?? 0,
    fixasMensais: fixas._sum.amountCents ?? 0,
  };
}

export type Receivable = Awaited<ReturnType<typeof getReceivables>>[number];
export type ContractListItem = Awaited<ReturnType<typeof getContracts>>[number];
export type ClientContract = Awaited<ReturnType<typeof getClientContracts>>[number];
