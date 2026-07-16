import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/features/auth/current-user";
import { AdminNav } from "./_components/admin-nav";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();

  const dbUser = await getCurrentUser();
  if (dbUser?.role !== "ADMIN") notFound();

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
