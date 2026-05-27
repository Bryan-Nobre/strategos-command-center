import { Bell, LogOut, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouterState, useRouteContext } from "@tanstack/react-router";
import { signOut } from "@/lib/supabase/session";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  eleitores: "Eleitores",
  liderancas: "Lideranças",
  demandas: "Demandas",
  agenda: "Agenda",
  pesquisas: "Pesquisas",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
  admin: "Admin",
  tenants: "Clientes",
  metricas: "Métricas",
};

export function AppNavbar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const seg = path.split("/").filter(Boolean);
  const { profile, activeTenant } = useRouteContext({ strict: false });

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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <nav className="hidden items-center gap-1.5 text-sm md:flex">
        <span className="text-muted-foreground">{activeTenant?.name ?? "Strategos"}</span>
        {seg.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-muted-foreground/50">/</span>
            <span
              className={
                i === seg.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"
              }
            >
              {labels[s] ?? s}
            </span>
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar eleitor, liderança, demanda..." className="h-9 w-72 pl-9" />
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-xs leading-tight sm:block">
                <div className="font-medium">{profile?.full_name ?? "Usuário"}</div>
                <div className="text-muted-foreground">{activeTenant?.name}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
