import { prisma } from "@/lib/prisma";

/** Dias sem atualização a partir dos quais um lead é considerado "esfriando". */
const DIAS_PARA_FOLLOW_UP = 7;

function fimDoDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function inicioDoDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Monta a rotina do dia de uma pessoa.
 *
 * Combina duas fontes: tarefas explícitas (criadas por alguém) e sugestões
 * derivadas dos dados — leads parados e agendamentos de hoje. As sugestões não
 * viram registro no banco: são calculadas na hora, então nunca ficam
 * desatualizadas nem entopem a tabela.
 */
export async function getRoutine(userId: string) {
  const hoje = new Date();
  const limite = new Date(hoje.getTime() - DIAS_PARA_FOLLOW_UP * 86_400_000);

  const [tarefas, atrasadas, leadsParados, agendamentosHoje] = await Promise.all([
    // tarefas de hoje
    prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: "PENDING",
        dueAt: { gte: inicioDoDia(hoje), lte: fimDoDia(hoje) },
      },
      include: { contact: { select: { id: true, name: true, company: true } } },
      orderBy: { dueAt: "asc" },
    }),
    // vencidas de dias anteriores
    prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: "PENDING",
        dueAt: { lt: inicioDoDia(hoje) },
      },
      include: { contact: { select: { id: true, name: true, company: true } } },
      orderBy: { dueAt: "asc" },
      take: 20,
    }),
    // leads sem movimentação há mais de uma semana e ainda não fechados
    prisma.contact.findMany({
      where: {
        type: "LEAD",
        updatedAt: { lt: limite },
        stage: { name: { not: { contains: "Perdido" } } },
      },
      select: {
        id: true,
        name: true,
        company: true,
        updatedAt: true,
        stage: { select: { name: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 10,
    }),
    prisma.appointment.findMany({
      where: {
        assignedToId: userId,
        status: "SCHEDULED",
        startsAt: { gte: inicioDoDia(hoje), lte: fimDoDia(hoje) },
      },
      include: { contact: { select: { id: true, name: true } } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const total =
    tarefas.length + atrasadas.length + leadsParados.length + agendamentosHoje.length;

  return { tarefas, atrasadas, leadsParados, agendamentosHoje, total };
}

export type Routine = Awaited<ReturnType<typeof getRoutine>>;
