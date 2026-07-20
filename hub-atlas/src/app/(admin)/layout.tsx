import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/features/auth/current-user";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();

  const dbUser = await getCurrentUser();
  if (dbUser?.role !== "ADMIN") notFound();

  return (
    <div className="min-h-screen">
      <Sidebar />
      {/* margem acompanha a largura do sidebar (a variante `collapsed` vem do
          atributo no <html>, então isso anima junto com o retrair). */}
      <div className="flex min-h-screen flex-col pl-64 transition-[padding] duration-200 collapsed:pl-16">
        <Topbar />
        <main className="flex-1 px-5 py-6 sm:px-7">{children}</main>
      </div>
    </div>
  );
}
