import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { IconBell, IconSearch } from "@/components/ui/icons";
import { DrawerToggle } from "@/features/shell/drawer-toggle";

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/60 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-16 items-center gap-3 px-5 sm:px-7">
        {/* menu (só mobile) */}
        <DrawerToggle />

        {/* busca */}
        <label className="relative hidden min-w-0 flex-1 items-center sm:flex sm:max-w-sm">
          <IconSearch className="pointer-events-none absolute left-3 size-4 text-subtle" />
          <input
            type="search"
            placeholder="Buscar contatos..."
            className="h-9 w-full rounded-full border border-border bg-surface/60 pl-9 pr-4 text-sm text-text placeholder:text-subtle focus:border-brand-border"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            aria-label="Notificações"
            title="Notificações"
            className="relative grid size-9 place-items-center rounded-md border border-border text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <IconBell className="size-4" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand" />
          </button>

          <div className="ml-1 flex items-center rounded-full border border-border bg-surface/60 p-1">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}
