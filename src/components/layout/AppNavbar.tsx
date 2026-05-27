import { Bell, LogOut, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouterState, useRouteContext } from "@tanstack/react-router";
import { signOut } from "@/lib/supabase/session";
import { resolveRouteMeta } from "@/lib/navigation-meta";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppNavbar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { profile, activeTenant } = useRouteContext({ strict: false });
  const meta = resolveRouteMeta(path);
  const Icon = meta.icon;

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <header className="strategos-topbar transition-theme sticky top-0 z-30 px-4 md:px-6">
      <div className="flex h-[4.25rem] items-center gap-3 lg:gap-6">
        {/* Esquerda — contexto da página */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <div className="topbar-section-icon hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex">
            <Icon className="h-[1.125rem] w-[1.125rem]" />
          </div>
          <div className="min-w-0">
            <p className="topbar-title truncate">{meta.title}</p>
            <p className="topbar-subtitle truncate">{meta.subtitle}</p>
            {activeTenant?.name && (
              <p className="mt-0.5 hidden truncate text-[11px] text-muted-foreground/80 xl:block">
                {activeTenant.name}
              </p>
            )}
          </div>
        </div>

        {/* Centro — busca premium */}
        <div className="hidden flex-[1.2] justify-center px-2 lg:flex">
          <div className="strategos-search relative w-full max-w-[32rem]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar eleitor, liderança, demanda..."
              className="strategos-search-input h-10 w-full rounded-xl pl-11 pr-4 text-sm outline-none transition-theme placeholder:text-muted-foreground"
              aria-label="Buscar na campanha"
            />
          </div>
        </div>

        {/* Direita — ações e usuário */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="relative lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Buscar">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="topbar-divider mx-1 hidden h-8 w-px sm:block" aria-hidden />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="topbar-user-card flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 transition-theme"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 text-left leading-tight md:block">
                  <div className="max-w-[8.5rem] truncate text-sm font-semibold text-foreground">
                    {profile?.full_name ?? "Usuário"}
                  </div>
                  <div className="max-w-[8.5rem] truncate text-[11px] text-muted-foreground">
                    {activeTenant?.name ?? "Campanha"}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
