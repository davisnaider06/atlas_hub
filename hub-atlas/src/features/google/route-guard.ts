import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/features/auth/current-user";
import { can, type Capability } from "@/features/auth/permissions";

/**
 * Igual ao `requireCapability`, mas para Route Handlers: em vez de lançar (o
 * que viraria um 500), redireciona pro login ou pra home. Rotas de API não têm
 * layout, então não herdam a proteção da área administrativa.
 */
export async function requireCapabilityOrRedirect(
  cap: Capability,
  rotaDeVolta: string,
) {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(rotaDeVolta)}`);
  }

  const user = await getCurrentUser();
  if (!can(user?.role, cap)) {
    redirect("/");
  }

  return user!;
}
