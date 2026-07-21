import { prisma } from "@/lib/prisma";

/**
 * OAuth com o Google, por usuário.
 *
 * Falamos direto com os endpoints REST via fetch em vez de usar o pacote
 * `googleapis` — precisamos de três chamadas apenas (token, refresh, eventos),
 * e a lib pesa dezenas de MB.
 */

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  // só eventos: permite criar/editar/apagar sem dar leitura de tudo da agenda
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

function env(nome: string) {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ausente: ${nome}`);
  return valor;
}

export function getRedirectUri() {
  // precisa bater EXATAMENTE com o URI cadastrado no console do Google
  return `${env("APP_URL").replace(/\/$/, "")}/api/google/callback`;
}

export function googleIsConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** URL pra onde mandamos o usuário autorizar. */
export function buildAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    // offline + consent garantem que venha refresh_token (o Google só manda
    // refresh_token na primeira autorização, a menos que forcemos o consent)
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
};

/** Decodifica o payload do id_token sem verificar assinatura.
 *  Seguro aqui: o token veio direto do endpoint do Google via HTTPS. */
function emailFromIdToken(idToken?: string) {
  if (!idToken) return null;
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    const json = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    return (JSON.parse(json) as { email?: string }).email ?? null;
  } catch {
    return null;
  }
}

/** Troca o `code` do callback pelos tokens e salva a conexão do usuário. */
export async function exchangeCodeAndSave(code: string, userId: string) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao trocar o code: ${res.status} ${await res.text()}`);
  }

  const token = (await res.json()) as TokenResponse;
  if (!token.refresh_token) {
    throw new Error(
      "O Google não devolveu refresh_token. Revogue o acesso do app na conta Google e conecte de novo.",
    );
  }

  const googleEmail = emailFromIdToken(token.id_token) ?? "conta Google";
  const expiresAt = new Date(Date.now() + token.expires_in * 1000);

  await prisma.googleAccount.upsert({
    where: { userId },
    create: {
      userId,
      googleEmail,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
    },
    update: {
      googleEmail,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
    },
  });
}

/**
 * Devolve um access token válido do usuário, renovando se estiver perto de
 * expirar. Retorna null se o usuário não conectou a agenda.
 */
export async function getValidAccessToken(userId: string) {
  const conta = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!conta) return null;

  // margem de 1 min pra não usar um token que expira no meio da chamada
  if (conta.expiresAt.getTime() - 60_000 > Date.now()) {
    return conta.accessToken;
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      refresh_token: conta.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    // refresh revogado pelo usuário na conta Google: derruba a conexão pra ele
    // poder reconectar em vez de ficar falhando pra sempre
    await prisma.googleAccount.delete({ where: { userId } }).catch(() => {});
    return null;
  }

  const token = (await res.json()) as TokenResponse;
  await prisma.googleAccount.update({
    where: { userId },
    data: {
      accessToken: token.access_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
  });

  return token.access_token;
}
