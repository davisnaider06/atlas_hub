import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Dados do portal do cliente: o próprio usuário e, se estiver vinculado a um
 * Contact, o cadastro dele com agendamentos e documentos.
 *
 * O vínculo User -> Contact é opcional, então tudo aqui trata a ausência: um
 * usuário recém-criado pelo webhook ainda não tem cadastro associado.
 */
export async function getPortalData() {
  const { userId } = await auth();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      contact: {
        include: {
          stage: true,
          appointments: {
            orderBy: { startsAt: "asc" },
            take: 5,
          },
          documents: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });
}

export type PortalData = Awaited<ReturnType<typeof getPortalData>>;
