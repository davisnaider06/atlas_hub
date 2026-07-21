import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "./oauth";
import { ensureAtlasCalendar, googleFetch } from "./calendar";

/**
 * Traz do Google para o Hub o que mudou na agenda "Atlas Agendamentos".
 *
 * Usa o syncToken do Google: da segunda vez em diante ele devolve só o delta,
 * em vez da agenda inteira. Quando o token expira (410), refazemos a carga
 * completa a partir de hoje.
 */

type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email?: string; organizer?: boolean; self?: boolean }[];
  organizer?: { email?: string; self?: boolean };
};

export type ResultadoSync = {
  ok: boolean;
  criados: number;
  atualizados: number;
  removidos: number;
  motivo?: string;
};

/** Data de início do evento; eventos de dia inteiro trazem `date` em vez de `dateTime`. */
function inicioDe(e: GoogleEvent) {
  const bruto = e.start?.dateTime ?? e.start?.date;
  return bruto ? new Date(bruto) : null;
}

function fimDe(e: GoogleEvent, inicio: Date) {
  const bruto = e.end?.dateTime ?? e.end?.date;
  // sem fim declarado, assume 1h — evita agendamento com duração zero
  return bruto ? new Date(bruto) : new Date(inicio.getTime() + 60 * 60_000);
}

/**
 * Descobre o cliente a partir dos convidados: o primeiro que não seja o próprio
 * atendente. Se o email não existir no CRM, cria o contato no primeiro estágio
 * — é um lead novo que apareceu pela agenda.
 */
async function resolverContato(e: GoogleEvent, emailDoAtendente: string) {
  const convidado = e.attendees?.find(
    (a) => a.email && !a.self && !a.organizer && a.email !== emailDoAtendente,
  );
  const email = convidado?.email;
  if (!email) return null;

  const existente = await prisma.contact.findFirst({ where: { email } });
  if (existente) return existente.id;

  const primeiroEstagio = await prisma.pipelineStage.findFirst({
    orderBy: { order: "asc" },
  });
  if (!primeiroEstagio) return null;

  const criado = await prisma.contact.create({
    data: {
      // sem nome no convite, usamos a parte antes do @ como nome provisório
      name: email.split("@")[0],
      email,
      stageId: primeiroEstagio.id,
      notes: "Criado automaticamente a partir de um evento do Google Calendar.",
    },
  });
  return criado.id;
}

export async function pullFromGoogle(userId: string): Promise<ResultadoSync> {
  const vazio = { criados: 0, atualizados: 0, removidos: 0 };

  const conta = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!conta) return { ok: false, ...vazio, motivo: "conta Google não conectada" };

  const token = await getValidAccessToken(userId);
  if (!token) return { ok: false, ...vazio, motivo: "sem token válido" };

  const calendarId = await ensureAtlasCalendar(userId);
  if (!calendarId) return { ok: false, ...vazio, motivo: "agenda Atlas indisponível" };

  let criados = 0;
  let atualizados = 0;
  let removidos = 0;
  let syncToken = conta.syncToken;
  let pageToken: string | undefined;
  let novoSyncToken: string | undefined;

  do {
    const params = new URLSearchParams({ showDeleted: "true", maxResults: "250" });
    if (syncToken) params.set("syncToken", syncToken);
    // primeira carga: só do mês passado pra frente, pra não importar anos de histórico
    else params.set("timeMin", new Date(Date.now() - 30 * 86_400_000).toISOString());
    if (pageToken) params.set("pageToken", pageToken);

    const res = await googleFetch(
      token,
      `/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    );

    // 410 = syncToken expirou: zera e refaz carga completa
    if (res.status === 410) {
      await prisma.googleAccount.update({
        where: { userId },
        data: { syncToken: null },
      });
      syncToken = null;
      pageToken = undefined;
      continue;
    }

    if (!res.ok) {
      return { ok: false, criados, atualizados, removidos, motivo: `Google ${res.status}` };
    }

    const dados = (await res.json()) as {
      items?: GoogleEvent[];
      nextPageToken?: string;
      nextSyncToken?: string;
    };

    for (const evento of dados.items ?? []) {
      const existente = await prisma.appointment.findFirst({
        where: { googleEventId: evento.id },
      });

      // apagado ou cancelado no Google -> some do Hub
      if (evento.status === "cancelled") {
        if (existente) {
          await prisma.appointment.delete({ where: { id: existente.id } });
          removidos++;
        }
        continue;
      }

      const inicio = inicioDe(evento);
      if (!inicio) continue; // evento sem data utilizável

      const dadosComuns = {
        title: evento.summary?.trim() || "(sem título)",
        startsAt: inicio,
        endsAt: fimDe(evento, inicio),
        notes: evento.description ?? null,
      };

      if (existente) {
        await prisma.appointment.update({
          where: { id: existente.id },
          data: dadosComuns,
        });
        atualizados++;
      } else {
        const contactId = await resolverContato(evento, conta.googleEmail);
        await prisma.appointment.create({
          data: {
            ...dadosComuns,
            contactId,
            assignedToId: userId,
            googleEventId: evento.id,
            googleCalendarId: calendarId,
          },
        });
        criados++;
      }
    }

    pageToken = dados.nextPageToken;
    novoSyncToken = dados.nextSyncToken ?? novoSyncToken;
  } while (pageToken);

  if (novoSyncToken) {
    await prisma.googleAccount.update({
      where: { userId },
      data: { syncToken: novoSyncToken },
    });
  }

  return { ok: true, criados, atualizados, removidos };
}
