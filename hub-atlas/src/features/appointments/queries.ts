import { prisma } from "@/lib/prisma";

const incluiRelacoes = {
  contact: { select: { id: true, name: true, email: true, company: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} as const;

/** Agendamentos futuros (ou de hoje), do mais próximo pro mais distante. */
export function getUpcomingAppointments() {
  const agora = new Date();
  return prisma.appointment.findMany({
    where: { startsAt: { gte: agora }, status: { not: "CANCELED" } },
    include: incluiRelacoes,
    orderBy: { startsAt: "asc" },
  });
}

/** Agendamentos já passados ou cancelados, do mais recente pro mais antigo. */
export function getPastAppointments() {
  const agora = new Date();
  return prisma.appointment.findMany({
    where: {
      OR: [{ startsAt: { lt: agora } }, { status: "CANCELED" }],
    },
    include: incluiRelacoes,
    orderBy: { startsAt: "desc" },
    take: 50,
  });
}

/**
 * Agendamentos numa janela ampla ao redor de hoje.
 *
 * A navegação entre meses acontece no cliente, então trazemos de uma vez o que
 * o usuário provavelmente vai olhar — evita uma ida ao servidor a cada clique
 * na seta (e o volume de um CRM desse porte é pequeno).
 */
export function getAppointmentsAroundNow() {
  const hoje = new Date();
  const de = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1);
  const ate = new Date(hoje.getFullYear(), hoje.getMonth() + 13, 0, 23, 59, 59);

  return prisma.appointment.findMany({
    where: { startsAt: { gte: de, lte: ate } },
    include: incluiRelacoes,
    orderBy: { startsAt: "asc" },
  });
}

export function getAppointmentById(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: incluiRelacoes,
  });
}

/** Contatos disponíveis pra vincular num agendamento. */
export function getContactOptions() {
  return prisma.contact.findMany({
    select: { id: true, name: true, email: true, company: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Quem pode ser atendente: qualquer pessoa com acesso ao painel.
 *
 * Filtrar por role="ADMIN" deixava o sócio (OWNER) fora da lista, obrigando a
 * escolher outra pessoa — e se ela não tivesse o Google conectado, o evento
 * nunca chegava à agenda.
 *
 * Traz também se a pessoa conectou o Google, pra a tela avisar antes de criar
 * em vez de falhar em silêncio depois.
 */
export async function getAttendantOptions() {
  const membros = await prisma.user.findMany({
    where: { role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
    select: {
      id: true,
      name: true,
      email: true,
      googleAccount: { select: { id: true } },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  return membros.map(({ googleAccount, ...m }) => ({
    ...m,
    temGoogle: googleAccount !== null,
  }));
}

export type AppointmentListItem = Awaited<
  ReturnType<typeof getUpcomingAppointments>
>[number];
export type AppointmentDetail = NonNullable<
  Awaited<ReturnType<typeof getAppointmentById>>
>;
export type ContactOption = Awaited<ReturnType<typeof getContactOptions>>[number];
export type AttendantOption = Awaited<ReturnType<typeof getAttendantOptions>>[number];
