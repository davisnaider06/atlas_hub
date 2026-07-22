import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "./oauth";

const API = "https://www.googleapis.com/calendar/v3";

/** Nome da agenda dedicada criada pelo Hub quando não existe nenhuma. */
export const NOME_AGENDA = "Atlas Agendamentos";

/**
 * Normaliza pra comparar nomes de agenda: sem acento, sem pontuação, sem
 * espaço, tudo minúsculo.
 *
 * Sem isto, "ATLAS - AGENDAMENTOS" (criada à mão) não casaria com
 * "Atlas Agendamentos" e o Hub criaria uma segunda agenda, ficando a olhar
 * pra uma agenda vazia enquanto os eventos caem na outra.
 */
function normalizar(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const ALVO = normalizar(NOME_AGENDA);

/** Lista as agendas em que o usuário pode criar eventos. */
export async function listCalendars(userId: string) {
  const token = await getValidAccessToken(userId);
  if (!token) return [];

  const res = await googleFetch(token, "/users/me/calendarList?maxResults=250");
  if (!res.ok) return [];

  const dados = (await res.json()) as {
    items?: { id: string; summary?: string; accessRole?: string; primary?: boolean }[];
  };

  return (dados.items ?? [])
    .filter((c) => c.accessRole === "owner" || c.accessRole === "writer")
    .map((c) => ({
      id: c.id,
      nome: c.summary ?? c.id,
      principal: Boolean(c.primary),
    }));
}

type Agendamento = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  notes: string | null;
  assignedToId: string;
  googleEventId: string | null;
  googleCalendarId: string | null;
  contact: { name: string; email: string | null } | null;
};

export async function googleFetch(
  token: string,
  caminho: string,
  init?: RequestInit,
) {
  return fetch(`${API}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

/**
 * Garante que a agenda "Atlas Agendamentos" existe e devolve o id dela.
 *
 * Procura primeiro entre as agendas do usuário (caso ele já tenha criado ou já
 * tenhamos criado antes); só cria se não achar. Assim reconectar a conta não
 * gera agendas duplicadas.
 */
export async function ensureAtlasCalendar(userId: string): Promise<string | null> {
  const conta = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!conta) return null;

  const token = await getValidAccessToken(userId);
  if (!token) return null;

  // Já existe agenda definida (escolhida na tela de Configurações ou descoberta
  // antes). Só abrimos mão dela se o Google disser que ela SUMIU (404/410).
  //
  // Qualquer outra falha — rede, 5xx, limite — mantém a escolha: como pode
  // haver duas agendas com nome equivalente ("Atlas Agendamentos" e
  // "ATLAS - AGENDAMENTOS"), re-descobrir por nome trocaria a agenda do usuário
  // por outra silenciosamente, e os eventos passariam a cair no lugar errado.
  if (conta.calendarId) {
    const res = await googleFetch(
      token,
      `/calendars/${encodeURIComponent(conta.calendarId)}`,
    );
    if (res.ok) return conta.calendarId;
    if (res.status !== 404 && res.status !== 410) {
      console.error(
        `[google-sync] verificação da agenda falhou (${res.status}); mantendo a configurada`,
      );
      return conta.calendarId;
    }
    console.error("[google-sync] agenda configurada não existe mais; procurando outra");
  }

  const lista = await googleFetch(token, "/users/me/calendarList?maxResults=250");
  if (lista.ok) {
    const dados = (await lista.json()) as {
      items?: { id: string; summary?: string }[];
    };
    // comparação tolerante: casa "ATLAS - AGENDAMENTOS", "atlas agendamentos" etc.
    const achada = dados.items?.find(
      (c) => c.summary && normalizar(c.summary) === ALVO,
    );
    if (achada) {
      await prisma.googleAccount.update({
        where: { userId },
        data: { calendarId: achada.id, syncToken: null },
      });
      return achada.id;
    }
  }

  const criada = await googleFetch(token, "/calendars", {
    method: "POST",
    body: JSON.stringify({
      summary: NOME_AGENDA,
      description:
        "Agenda gerenciada pelo Hub Atlas. Eventos aqui sincronizam com o CRM.",
      timeZone: "America/Sao_Paulo",
    }),
  });

  if (!criada.ok) return null;

  const { id } = (await criada.json()) as { id: string };
  await prisma.googleAccount.update({
    where: { userId },
    data: { calendarId: id, syncToken: null },
  });
  return id;
}

function corpoDoEvento(a: Agendamento) {
  return {
    summary: a.title,
    description: a.notes ?? undefined,
    start: { dateTime: a.startsAt.toISOString() },
    end: { dateTime: a.endsAt.toISOString() },
    // convida o cliente: ele recebe o convite na agenda dele
    attendees: a.contact?.email ? [{ email: a.contact.email }] : undefined,
  };
}

/**
 * Espelha o agendamento na agenda dedicada do atendente.
 *
 * Falha de sincronização NÃO derruba a operação no Hub: o agendamento é a fonte
 * de verdade e o Google é um espelho.
 */
export async function syncAppointmentToGoogle(
  appointmentId: string,
): Promise<{ ok: boolean; motivo?: string }> {
  // O push é tolerante a falha (o Hub é a fonte de verdade), então sem log
  // uma falha some sem deixar rastro — e foi exatamente o que aconteceu.
  const falhar = (motivo: string) => {
    console.error(`[google-sync] push falhou (${appointmentId}): ${motivo}`);
    return { ok: false, motivo };
  };

  const a = (await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { contact: { select: { name: true, email: true } } },
  })) as Agendamento | null;

  if (!a) return falhar("agendamento não encontrado");

  const token = await getValidAccessToken(a.assignedToId);
  if (!token) return falhar("atendente não conectou o Google Calendar");

  const calendarId = await ensureAtlasCalendar(a.assignedToId);
  if (!calendarId) return falhar("não foi possível acessar a agenda Atlas");

  const criando = !a.googleEventId;
  const base = `/calendars/${encodeURIComponent(calendarId)}/events`;
  const caminho = criando
    ? `${base}?sendUpdates=all`
    : `${base}/${a.googleEventId}?sendUpdates=all`;

  const res = await googleFetch(token, caminho, {
    method: criando ? "POST" : "PATCH",
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
      return falhar("evento não existe mais no Google; será recriado");
    }
    return falhar(`Google respondeu ${res.status}: ${texto.slice(0, 300)}`);
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
  if (!token) {
    console.error(`[google-sync] delete falhou (${appointmentId}): sem token`);
    return { ok: false, motivo: "sem conexão com o Google" };
  }

  const calendarId = a.googleCalendarId ?? (await ensureAtlasCalendar(a.assignedToId));
  if (!calendarId) return { ok: false, motivo: "agenda não encontrada" };

  const res = await googleFetch(
    token,
    `/calendars/${encodeURIComponent(calendarId)}/events/${a.googleEventId}?sendUpdates=all`,
    { method: "DELETE" },
  );

  // 404/410 = já não está lá; para o nosso objetivo é sucesso
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const texto = await res.text();
    console.error(
      `[google-sync] delete falhou (${appointmentId}): ${res.status} ${texto.slice(0, 300)}`,
    );
    return { ok: false, motivo: `Google respondeu ${res.status}` };
  }

  await prisma.appointment.update({
    where: { id: a.id },
    data: { googleEventId: null, googleCalendarId: null },
  });
  return { ok: true };
}
