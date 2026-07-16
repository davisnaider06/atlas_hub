import "dotenv/config";
import { prisma } from "@/lib/prisma";

const STAGES = [
  "Novo Lead",
  "Contato Feito",
  "Proposta Enviada",
  "Negociação",
  "Fechado - Ganho",
  "Fechado - Perdido",
];

async function main() {
  for (const [index, name] of STAGES.entries()) {
    await prisma.pipelineStage.upsert({
      where: { order: index },
      create: { name, order: index },
      update: { name },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
