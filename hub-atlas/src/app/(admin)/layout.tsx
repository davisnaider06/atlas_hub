import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/features/auth/current-user";
import { podeAcessarPainel, capacidadesDe } from "@/features/auth/permissions";
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

  // capacidades do usuário, direto da matriz (o menu esconde o que ele não pode)
  const caps = capacidadesDe(dbUser?.role);

  return (
    <div className="min-h-screen overflow-x-clip">
      <Sidebar caps={caps} />
      {/* margem acompanha a largura do sidebar (a variante `collapsed` vem do
          atributo no <html>, então isso anima junto com o retrair). */}
      <div className="flex min-h-screen flex-col transition-[padding] duration-200 lg:pl-64 lg:collapsed:pl-16">
        <Topbar />
        <main className="flex-1 px-5 py-6 sm:px-7">{children}</main>
      </div>
    </div>
  );
}
