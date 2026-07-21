import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const event = await verifyWebhook(request);

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = event.data;
    const email = user.email_addresses.find(
      (e) => e.id === user.primary_email_address_id,
    )?.email_address;
    if (!email) return new Response("User has no primary email", { status: 400 });

    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || null;

    // Papel só é definido na CRIAÇÃO. No update ele é deliberadamente omitido:
    // a fonte de verdade do papel é a tela de Equipe, e sobrescrever aqui
    // apagaria a permissão dada por um sócio na primeira vez que a pessoa
    // mudasse qualquer coisa no perfil do Clerk.
    const roleInicial = user.public_metadata?.role === "admin" ? "OWNER" : "CLIENT";

    // Casa por email pra respeitar o pré-cadastro (pessoa cadastrada na Equipe
    // antes do primeiro login já existe, com clerkId nulo).
    const existente = await prisma.user.findFirst({
      where: { OR: [{ clerkId: user.id }, { email }] },
    });

    if (existente) {
      await prisma.user.update({
        where: { id: existente.id },
        data: { clerkId: user.id, email, name: existente.name ?? name },
      });
    } else {
      await prisma.user.create({
        data: { clerkId: user.id, email, name, role: roleInicial },
      });
    }
  }

  if (event.type === "user.deleted" && event.data.id) {
    await prisma.user.deleteMany({ where: { clerkId: event.data.id } });
  }

  return new Response("OK", { status: 200 });
}
