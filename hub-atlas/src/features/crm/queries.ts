import { prisma } from "@/lib/prisma";

export function getPipelineStages() {
  return prisma.pipelineStage.findMany({ orderBy: { order: "asc" } });
}

/** Busca contatos, opcionalmente filtrando por tipo (leads x clientes). */
export function getContacts(search?: string, type?: "LEAD" | "CLIENT") {
  const query = search?.trim();

  return prisma.contact.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { company: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { stage: true, service: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getContactById(id: string) {
  return prisma.contact.findUnique({
    where: { id },
    include: { stage: true, service: true },
  });
}

export async function getPipelineBoard() {
  const stages = await prisma.pipelineStage.findMany({
    orderBy: { order: "asc" },
    include: {
      contacts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return stages;
}

export type PipelineBoard = Awaited<ReturnType<typeof getPipelineBoard>>;
export type ContactWithStage = NonNullable<Awaited<ReturnType<typeof getContactById>>>;
export type ContactListItem = Awaited<ReturnType<typeof getContacts>>[number];
export type StageOption = Awaited<ReturnType<typeof getPipelineStages>>[number];
