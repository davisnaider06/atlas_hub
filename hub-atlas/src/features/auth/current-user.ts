import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// O webhook do Clerk (src/app/api/webhooks/clerk/route.ts) é a fonte de verdade
// pra manter o User sincronizado, mas ele só é alcançável quando a app tem uma
// URL pública (deploy). Em dev local o Clerk não consegue chamar localhost, então
// criamos o registro on-demand aqui no primeiro acesso autenticado.
export async function getCurrentUser() {
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

  const role = clerkUser.publicMetadata?.role === "admin" ? "ADMIN" : "CLIENT";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  return prisma.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, email, name, role },
    update: { email, name, role },
  });
}

// Server Functions são alcançáveis por POST direto, não só pela UI protegida
// pelo layout — todo mutation de admin precisa checar o role de novo aqui.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    throw new Error("Forbidden: admin role required");
  }
  return user;
}
