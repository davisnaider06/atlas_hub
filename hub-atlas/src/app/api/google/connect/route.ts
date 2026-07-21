import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { requireCapabilityOrRedirect } from "@/features/google/route-guard";
import { buildAuthUrl, googleIsConfigured } from "@/features/google/oauth";

export const STATE_COOKIE = "google_oauth_state";

/** Inicia o fluxo: manda o usuário pra tela de consentimento do Google. */
export async function GET() {
  await requireCapabilityOrRedirect("appointments.manage", "/dashboard/settings");

  if (!googleIsConfigured()) {
    redirect("/dashboard/settings?erro=google_nao_configurado");
  }

  // state anti-CSRF: guardamos num cookie e conferimos no callback
  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 min pra concluir o consentimento
  });

  redirect(buildAuthUrl(state));
}
