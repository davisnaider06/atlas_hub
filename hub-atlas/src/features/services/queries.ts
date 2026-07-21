import { prisma } from "@/lib/prisma";

/** Catálogo completo: ativos primeiro, depois alfabético. */
export function getServices() {
  return prisma.service.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { contacts: true } } },
  });
}

/** Só os ativos — usados nos seletores de serviço contratado. */
export function getActiveServices() {
  return prisma.service.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export function getServiceById(id: string) {
  return prisma.service.findUnique({
    where: { id },
    include: { _count: { select: { contacts: true } } },
  });
}

export type ServiceListItem = Awaited<ReturnType<typeof getServices>>[number];
export type ServiceOption = Awaited<ReturnType<typeof getActiveServices>>[number];
