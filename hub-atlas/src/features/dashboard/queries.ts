import { prisma } from "@/lib/prisma";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_NA_SERIE = 8;

export type SeriePonto = { mes: string; contatos: number };

/**
 * Métricas do painel. Busca os contatos uma vez e deriva tudo em memória —
 * o volume de um CRM desse porte não justifica agregação no banco, e assim
 * a série mensal fica sem buraco (meses sem contato aparecem como zero).
 */
export async function getDashboardData() {
  const [stages, contacts] = await Promise.all([
    prisma.pipelineStage.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { contacts: true } } },
    }),
    prisma.contact.findMany({
      select: {
        id: true,
        name: true,
        company: true,
        createdAt: true,
        stage: { select: { name: true, order: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // série dos últimos meses, incluindo os vazios
  const hoje = new Date();
  const serie: SeriePonto[] = [];
  for (let i = MESES_NA_SERIE - 1; i >= 0; i--) {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
    serie.push({
      mes: MESES[inicio.getMonth()],
      contatos: contacts.filter((c) => c.createdAt >= inicio && c.createdAt < fim).length,
    });
  }

  const total = contacts.length;
  const mesAtual = serie.at(-1)?.contatos ?? 0;
  const mesAnterior = serie.at(-2)?.contatos ?? 0;

  // sem base de comparação, um mês com entradas conta como +100%
  const variacao =
    mesAnterior > 0
      ? ((mesAtual - mesAnterior) / mesAnterior) * 100
      : mesAtual > 0
        ? 100
        : 0;

  const estagioGanho = stages.find((s) => /ganho/i.test(s.name));
  const ganhos = estagioGanho?._count.contacts ?? 0;
  const conversao = total > 0 ? (ganhos / total) * 100 : 0;

  return {
    stages,
    serie,
    total,
    mesAtual,
    variacao,
    conversao,
    ganhos,
    recentes: contacts.slice(0, 5),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
