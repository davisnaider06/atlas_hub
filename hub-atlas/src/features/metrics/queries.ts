import { prisma } from "@/lib/prisma";

/**
 * Desempenho de cada SDR no mês.
 *
 * Atribuição: leads/clientes pelo `ownerId` do Contact; vendas pelos contratos
 * criados no mês cujo cliente é do SDR; reuniões pelos agendamentos em que ele é
 * o atendente. Tudo agregado em memória (volume pequeno).
 *
 * "Venda" = valor do contrato fechado no mês: total do projeto (ONE_OFF) ou a
 * mensalidade (RECURRING, o MRR que ele trouxe).
 */
export async function getSdrMetrics(ref: Date = new Date()) {
  const inicioMes = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const fimMes = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);

  const [sdrs, contatos, reunioes, contratos] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        salesTargetCents: true,
        commissionPercent: true,
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
    prisma.contact.findMany({
      where: { ownerId: { not: null } },
      select: { ownerId: true, type: true },
    }),
    prisma.appointment.findMany({
      where: { startsAt: { gte: inicioMes, lt: fimMes }, status: { not: "CANCELED" } },
      select: { assignedToId: true },
    }),
    prisma.contract.findMany({
      where: { createdAt: { gte: inicioMes, lt: fimMes } },
      select: {
        type: true,
        totalCents: true,
        monthlyCents: true,
        contact: { select: { ownerId: true } },
      },
    }),
  ]);

  type Agg = { leads: number; clientes: number; reunioes: number; vendas: number };
  const porSdr = new Map<string, Agg>();
  const acc = (id: string) => {
    let x = porSdr.get(id);
    if (!x) {
      x = { leads: 0, clientes: 0, reunioes: 0, vendas: 0 };
      porSdr.set(id, x);
    }
    return x;
  };

  for (const c of contatos) {
    if (!c.ownerId) continue;
    const x = acc(c.ownerId);
    if (c.type === "LEAD") x.leads++;
    else x.clientes++;
  }
  for (const r of reunioes) acc(r.assignedToId).reunioes++;
  for (const ct of contratos) {
    const oid = ct.contact.ownerId;
    if (!oid) continue;
    const v = ct.type === "ONE_OFF" ? (ct.totalCents ?? 0) : (ct.monthlyCents ?? 0);
    acc(oid).vendas += v;
  }

  return sdrs.map((s) => {
    const x = porSdr.get(s.id) ?? { leads: 0, clientes: 0, reunioes: 0, vendas: 0 };
    const meta = s.salesTargetCents;
    const progresso = meta > 0 ? Math.min(100, Math.round((x.vendas / meta) * 100)) : 0;
    const comissao =
      s.commissionPercent != null
        ? Math.round((x.vendas * s.commissionPercent) / 100)
        : null;
    return { ...s, ...x, meta, progresso, comissao };
  });
}

export type SdrMetric = Awaited<ReturnType<typeof getSdrMetrics>>[number];
