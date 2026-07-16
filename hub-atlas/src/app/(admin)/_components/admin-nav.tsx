import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const links = [
  { href: "/dashboard", label: "Painel" },
  { href: "/dashboard/contacts", label: "Contatos" },
  { href: "/dashboard/pipeline", label: "Pipeline" },
];

export function AdminNav() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-8 py-4 dark:border-zinc-800">
      <nav className="flex items-center gap-6">
        <span className="font-semibold">Hub Atlas</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <UserButton />
    </header>
  );
}
