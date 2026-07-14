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

    const role = user.public_metadata?.role === "admin" ? "ADMIN" : "CLIENT";
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || null;

    await prisma.user.upsert({
      where: { clerkId: user.id },
      create: { clerkId: user.id, email, name, role },
      update: { email, name, role },
    });
  }

  if (event.type === "user.deleted" && event.data.id) {
    await prisma.user.deleteMany({ where: { clerkId: event.data.id } });
  }

  return new Response("OK", { status: 200 });
}
