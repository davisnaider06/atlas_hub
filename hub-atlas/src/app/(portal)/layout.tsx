import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/features/auth/current-user";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();

  const dbUser = await getCurrentUser();
  if (!dbUser) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5 sm:px-7">
          <Link href="/portal" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-fg">
              A
            </span>
            <span className="text-sm font-semibold tracking-tight">Hub Atlas</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center rounded-full border border-border bg-surface/60 p-1">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 sm:px-7">{children}</main>
    </div>
  );
}
