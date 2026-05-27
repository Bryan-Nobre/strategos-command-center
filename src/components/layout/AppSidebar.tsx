import { Link, useRouteContext, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Crown,
  MessageSquareWarning,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  Vote,
  Shield,
  LogOut,
  UserRound,
  Briefcase,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/lib/supabase/session";

type NavItem = { title: string; url: string; icon: LucideIcon };

const overviewItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Pesquisas", url: "/pesquisas", icon: BarChart3 },
];

const operationItems: NavItem[] = [
  { title: "Eleitores", url: "/eleitores", icon: Users },
  { title: "Lideranças", url: "/liderancas", icon: Crown },
  { title: "Demandas", url: "/demandas", icon: MessageSquareWarning },
  { title: "Agenda", url: "/agenda", icon: Calendar },
];

const adminItems: NavItem[] = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Equipe", url: "/equipe", icon: UsersRound },
];

export function AppSidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { profile, activeTenant, membershipRole } = useRouteContext({ strict: false });

  const roleLabel = membershipRole
    ? membershipRole === "owner"
      ? "Administrador"
      : membershipRole
    : "Operador";

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

  function renderGroup(items: NavItem[]) {
    return items.map((item) => {
      const active = path === item.url || (item.url !== "/dashboard" && path.startsWith(item.url));
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={active}
            tooltip={item.title}
            className="strategos-nav-item h-10"
          >
            <Link to={item.url} className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  }

  return (
    <Sidebar collapsible="icon" className="strategos-sidebar transition-theme">
      <SidebarHeader className="border-b border-sidebar-border px-3 pt-4">
        <div className="flex items-center gap-3 px-1 py-2">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
            style={{ backgroundImage: "var(--sidebar-logo-gradient)" }}
          >
            <Vote className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                Strategos CRM
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-sidebar-muted">
                Inteligência Política
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-2 space-y-3 pb-3">
            <div
              className="rounded-xl border border-sidebar-border p-3 transition-theme"
              style={{ backgroundColor: "var(--sidebar-surface)" }}
            >
              <p className="text-xs text-sidebar-muted">Campanha</p>
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {activeTenant?.name ?? "Sem campanha"}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-sidebar-muted">
                  Plano {activeTenant?.plan ?? "trial"}
                </span>
                <Badge className="h-5 border-primary/30 bg-primary/15 px-2 text-[10px] uppercase text-primary">
                  Ativo
                </Badge>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted/80">Visão Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderGroup(overviewItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted/80">Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderGroup(operationItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted/80">Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderGroup(adminItems)}
              {isSuperAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={path.startsWith("/admin")}
                    tooltip="Super Admin"
                    className="strategos-nav-item h-10"
                  >
                    <Link to="/admin/tenants" className="flex items-center gap-3">
                      <Shield className="h-5 w-5" />
                      <span>Super Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent p-2 text-left transition-theme hover:opacity-90"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {profile?.full_name ?? "Usuário"}
                  </p>
                  <p className="truncate text-xs text-sidebar-muted">{roleLabel}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/configuracoes">
                <UserRound className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/configuracoes">
                <Briefcase className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
