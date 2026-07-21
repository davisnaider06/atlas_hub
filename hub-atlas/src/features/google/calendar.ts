import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "./oauth";

const API = "https://www.googleapis.com/calendar/v3";

type Agendamento = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  notes: string | null;
  assignedToId: string;
  googleEventId: string | null;
  googleCalendarId: string | null;
  contact: { name: string; email: string | null };
};

function corpoDoEvento(a: Agendamento) {
  return {
    summary: a.title,
    description: a.notes ?? undefined,
    start: { dateTime: a.startsAt.toISOString() },
    end: { dateTime: a.endsAt.toISOString() },
    // convida o cliente: ele recebe o convite na agenda dele
    attendees: a.contact.email ? [{ email: a.contact.email }] : undefined,
  };
}

/**
 * Espelha o agendamento no Google Calendar do atendente.
 *
 * Falha de sincronização NÃO derruba a operação no Hub: o agendamento é a fonte
 * de verdade e o Google é um espelho. Retorna o motivo pra UI poder avisar.
 */
export async function syncAppointmentToGoogle(
  appointmentId: string,
): Promise<{ ok: boolean; motivo?: string }> {
  const a = (await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { contact: { select: { name: true, email: true } } },
  })) as Agendamento | null;

  if (!a) return { ok: false, motivo: "agendamento não encontrado" };

  const token = await getValidAccessToken(a.assignedToId);
  if (!token) return { ok: false, motivo: "atendente não conectou o Google Calendar" };

  const conta = await prisma.googleAccount.findUnique({
    where: { userId: a.assignedToId },
  });
  const calendarId = conta?.calendarId ?? "primary";

  // sendUpdates=all faz o Google disparar o convite por email pro cliente
  const criando = !a.googleEventId;
  const url = criando
    ? `${API}/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`
    : `${API}/calendars/${encodeURIComponent(calendarId)}/events/${a.googleEventId}?sendUpdates=all`;

  const res = await fetch(url, {
    method: criando ? "POST" : "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpoDoEvento(a)),
  });

  if (!res.ok) {
    const texto = await res.text();
    // evento apagado direto no Google: limpa a referência pra recriar na próxima
    if (res.status === 404 && !criando) {
      await prisma.appointment.update({
        where: { id: a.id },
        data: { googleEventId: null, googleCalendarId: null },
      });
      return { ok: false, motivo: "evento não existe mais no Google; será recriado" };
    }
    return { ok: false, motivo: `Google respondeu ${res.status}: ${texto.slice(0, 200)}` };
  }

  const evento = (await res.json()) as { id: string };
  await prisma.appointment.update({
    where: { id: a.id },
    data: { googleEventId: evento.id, googleCalendarId: calendarId },
  });

  return { ok: true };
}

/** Remove o evento do Google (usado ao cancelar/excluir). */
export async function removeAppointmentFromGoogle(appointmentId: string) {
  const a = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!a?.googleEventId) return { ok: true };

  const token = await getValidAccessToken(a.assignedToId);
  if (!token) return { ok: false, motivo: "sem conexão com o Google" };

  const calendarId = a.googleCalendarId ?? "primary";
  const res = await fetch(
    `${API}/calendars/${encodeURIComponent(calendarId)}/events/${a.googleEventId}?sendUpdates=all`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
  );

  // 410 = já removido no Google; tratamos como sucesso
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    return { ok: false, motivo: `Google respondeu ${res.status}` };
  }

  await prisma.appointment.update({
    where: { id: a.id },
    data: { googleEventId: null, googleCalendarId: null },
  });
  return { ok: true };
}
