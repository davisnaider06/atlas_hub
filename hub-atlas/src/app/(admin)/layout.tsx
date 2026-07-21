import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/features/auth/current-user";
import { podeAcessarPainel, can, type Capability } from "@/features/auth/permissions";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();

  const dbUser = await getCurrentUser();
  if (!podeAcessarPainel(dbUser?.role)) notFound();

  // capacidades do usuário: o menu esconde o que ele não pode acessar
  const TODAS: Capability[] = [
    "team.manage",
    "services.manage",
    "crm.manage",
    "crm.view",
    "appointments.manage",
    "dashboard.view",
  ];
  const caps = TODAS.filter((c) => can(dbUser?.role, c));

  return (
    <div className="min-h-screen">
      <Sidebar caps={caps} />
      {/* margem acompanha a largura do sidebar (a variante `collapsed` vem do
          atributo no <html>, então isso anima junto com o retrair). */}
      <div className="flex min-h-screen flex-col pl-64 transition-[padding] duration-200 collapsed:pl-16">
        <Topbar />
        <main className="flex-1 px-5 py-6 sm:px-7">{children}</main>
      </div>
    </div>
  );
}
