import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/features/auth/current-user";

/**
 * Igual ao `requireAdmin`, mas para Route Handlers: em vez de lançar (o que
 * viraria um 500), redireciona pro login ou pra home. Rotas de API não têm
 * layout, então não herdam o `auth.protect()` da área administrativa.
 */
export async function requireAdminOrRedirect(rotaDeVolta: string) {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(rotaDeVolta)}`);
  }

  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}
