import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { can, type Capability } from "./permissions";

// `cache` memoiza por requisição: layout, página e server actions podem chamar
// à vontade que o banco só é consultado uma vez por request.
export const getCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;
  if (!email) return null;

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  // Pré-cadastro: se o sócio já cadastrou esta pessoa na tela de Equipe, o
  // registro existe com clerkId nulo. Casamos por email e mantemos o papel
  // definido por ele — em vez de sobrescrever com o padrão.
  const preCadastrado = await prisma.user.findUnique({ where: { email } });
  if (preCadastrado && !preCadastrado.clerkId) {
    return prisma.user.update({
      where: { id: preCadastrado.id },
      data: { clerkId: userId, name: preCadastrado.name ?? name },
    });
  }

  // Metadata do Clerk ainda promove a admin — é como o primeiro sócio entra,
  // antes de existir alguém pra convidá-lo.
  const role = clerkUser.publicMetadata?.role === "admin" ? "OWNER" : "CLIENT";

  return prisma.user.upsert({
    where: { email },
    create: { clerkId: userId, email, name, role },
    update: { clerkId: userId, name },
  });
});

/** Server Functions são alcançáveis por POST direto, não só pela UI protegida
 *  pelo layout — todo mutation precisa checar a capacidade de novo aqui. */
export async function requireCapability(cap: Capability) {
  const user = await getCurrentUser();
  if (!can(user?.role, cap)) {
    throw new Error(`Forbidden: capacidade "${cap}" necessária`);
  }
  return user!;
}

/** Atalho legado: qualquer um que opere o CRM. */
export async function requireAdmin() {
  return requireCapability("crm.manage");
}
