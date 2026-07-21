import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireCapabilityOrRedirect } from "@/features/google/route-guard";
import { exchangeCodeAndSave } from "@/features/google/oauth";
import { STATE_COOKIE } from "../connect/route";

/** Volta do Google: valida o state, troca o code por tokens e salva. */
export async function GET(request: Request) {
  const user = await requireCapabilityOrRedirect("appointments.manage", "/dashboard/settings");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const erroGoogle = url.searchParams.get("error");

  const jar = await cookies();
  const stateEsperado = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);

  // usuário clicou em "cancelar" na tela do Google
  if (erroGoogle) {
    redirect(`/dashboard/settings?erro=${encodeURIComponent(erroGoogle)}`);
  }

  // state ausente ou diferente = requisição não partiu daqui
  if (!state || !stateEsperado || state !== stateEsperado) {
    redirect("/dashboard/settings?erro=state_invalido");
  }

  if (!code) {
    redirect("/dashboard/settings?erro=sem_code");
  }

  try {
    await exchangeCodeAndSave(code, user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro_desconhecido";
    redirect(`/dashboard/settings?erro=${encodeURIComponent(msg)}`);
  }

  redirect("/dashboard/settings?conectado=1");
}
