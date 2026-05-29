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
  Shield,
  LogOut,
  UserRound,
  UsersRound,
  CircleHelp,
  ChevronsUpDown,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/lib/supabase/session";
import { useTenantPermissions } from "@/hooks/use-tenant-permissions";
import { useAuth } from "@/contexts/auth-provider";
import { getSupportWhatsAppUrl } from "@/lib/support-contact";
import { cn } from "@/lib/utils";
import type { PermissionModule } from "@/types/permissions";

type NavItem = { title: string; url: string; icon: LucideIcon; module: PermissionModule };

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="sidebar-brand sidebar-brand--collapsed" aria-label="Strategos CRM">
        <span className="sidebar-brand-mark">S</span>
      </div>
    );
  }

  return (
    <div className="sidebar-brand">
      <span className="sidebar-brand-title">STRATEGOS</span>
      <div className="sidebar-brand-crm-row" aria-hidden>
        <span className="sidebar-brand-line" />
        <span className="sidebar-brand-crm">CRM</span>
        <span className="sidebar-brand-line" />
      </div>
      <p className="sidebar-brand-tagline">LIDERANÇA. DADOS. CONQUISTAS.</p>
    </div>
  );
}

const overviewItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { title: "Relatórios", url: "/relatorios", icon: FileText, module: "reports" },
  { title: "Pesquisas", url: "/pesquisas", icon: BarChart3, module: "polls" },
];

const operationItems: NavItem[] = [
  { title: "Eleitores", url: "/eleitores", icon: Users, module: "supporters" },
  { title: "Lideranças", url: "/liderancas", icon: Crown, module: "leaderships" },
  { title: "Demandas", url: "/demandas", icon: MessageSquareWarning, module: "demands" },
  { title: "Agenda", url: "/agenda", icon: Calendar, module: "agenda" },
];

const adminItems: NavItem[] = [
  { title: "Configurações", url: "/configuracoes", icon: Settings, module: "settings" },
  { title: "Equipe", url: "/equipe", icon: UsersRound, module: "team" },
];

export function AppSidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { profile, activeTenant } = useRouteContext({ strict: false });
  const { auth } = useAuth();
  const tenantId = activeTenant?.id ?? "";
  const perms = useTenantPermissions(tenantId);

  const userEmail = auth.user?.email ?? "";
  const supportUrl = getSupportWhatsAppUrl(
    "Olá! Preciso de ajuda com o Strategos CRM.",
  );

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
    const visible = items.filter((item) => perms.isLoading || perms.canRead(item.module));
    if (visible.length === 0) return null;

    return visible.map((item) => {
      const active = path === item.url || (item.url !== "/dashboard" && path.startsWith(item.url));
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={active}
            tooltip={item.title}
            className="strategos-nav-item h-10 rounded-lg"
          >
            <Link
              to={item.url}
              className={cn("flex items-center gap-3", collapsed && "justify-center gap-0")}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn(collapsed && "sr-only")}>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  }

  return (
    <Sidebar collapsible="icon" className="strategos-sidebar z-40 transition-theme">
      <SidebarHeader
        className={cn(
          "sidebar-logo-shell border-0 pb-4 pt-5",
          collapsed ? "px-2" : "px-4",
        )}
      >
        <Link
          to="/dashboard"
          className="flex w-full justify-center transition-opacity hover:opacity-95"
        >
          <SidebarBrand collapsed={collapsed} />
        </Link>
      </SidebarHeader>

      <SidebarContent className={cn("gap-1", collapsed ? "px-1" : "px-2")}>
        <SidebarGroup>
          <SidebarGroupLabel className="sidebar-group-label">Visão geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderGroup(overviewItems) ?? null}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="sidebar-group-label">Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderGroup(operationItems) ?? null}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="sidebar-group-label">Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderGroup(adminItems)}
              {isSuperAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      path === "/tenants" ||
                      path === "/plans" ||
                      path === "/users" ||
                      path === "/metricas"
                    }
                    tooltip="Super Admin"
                    className="strategos-nav-item h-10 rounded-lg"
                  >
                    <Link
                      to="/tenants"
                      className={cn("flex items-center gap-3", collapsed && "justify-center gap-0")}
                    >
                      <Shield className="h-5 w-5 shrink-0" />
                      <span className={cn(collapsed && "sr-only")}>Super Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className={cn("mt-auto gap-3 border-0", collapsed ? "items-center p-2" : "p-3")}
      >
        <a
          href={supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "sidebar-help-link flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-theme",
            collapsed && "justify-center px-2",
          )}
          title="Ajuda via WhatsApp"
        >
          <CircleHelp className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Ajuda</span>}
        </a>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "sidebar-profile-card flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-theme",
                collapsed && "sidebar-profile-card--icon-only w-auto justify-center p-0",
              )}
            >
              <Avatar className="h-9 w-9 shrink-0">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />
                ) : null}
                <AvatarFallback className="sidebar-profile-avatar text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="sidebar-user-name truncate text-sm font-semibold">
                      {profile?.full_name ?? "Usuário"}
                    </p>
                    <p className="sidebar-user-email truncate text-xs">
                      {userEmail || "Conta da campanha"}
                    </p>
                  </div>
                  <ChevronsUpDown className="sidebar-user-chevron h-4 w-4 shrink-0" aria-hidden />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/configuracoes">
                <UserRound className="mr-2 h-4 w-4 text-primary" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4 text-primary" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!collapsed && (
          <p className="px-1 text-center text-[11px] text-white/70">
            © 2026. Direitos reservados.
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
