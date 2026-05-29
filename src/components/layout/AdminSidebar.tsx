import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  BarChart3,
  Vote,
  Users,
  Shield,
  CreditCard,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-provider";
import { signOut } from "@/lib/supabase/session";
import { cn } from "@/lib/utils";

const items = [
  { title: "Clientes", url: "/tenants", icon: Building2 },
  { title: "Planos", url: "/plans", icon: CreditCard },
  { title: "Usuários", url: "/users", icon: Users },
  { title: "Métricas", url: "/metricas", icon: BarChart3 },
];

function AdminSidebarBrand({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="sidebar-brand sidebar-brand--collapsed" aria-label="Strategos Admin">
        <span className="sidebar-brand-mark">S</span>
      </div>
    );
  }

  return (
    <div className="sidebar-brand sidebar-brand--admin">
      <div className="flex items-center justify-center gap-2">
        <Vote className="h-6 w-6 shrink-0 text-[#6ee7a8]" aria-hidden />
        <span className="sidebar-brand-title text-[1.125rem]">ADMIN</span>
      </div>
      <p className="sidebar-brand-tagline mt-1 text-[0.5rem] tracking-[0.2em]">PLATAFORMA SAAS</p>
    </div>
  );
}

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { auth } = useAuth();

  const profile = auth.profile;
  const userEmail = auth.user?.email ?? "";
  const initials = (profile?.full_name ?? "A")
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
    <Sidebar collapsible="icon" className="strategos-sidebar strategos-admin-sidebar transition-theme">
      <SidebarHeader
        className={cn(
          "sidebar-logo-shell border-0 pb-4 pt-5",
          collapsed ? "px-2" : "px-4",
        )}
      >
        <Link
          to="/tenants"
          className="flex w-full justify-center transition-opacity hover:opacity-95"
        >
          <AdminSidebarBrand collapsed={collapsed} />
        </Link>
      </SidebarHeader>

      <SidebarContent className={cn("gap-1", collapsed ? "px-1" : "px-2")}>
        <SidebarGroup>
          <SidebarGroupLabel className="sidebar-group-label">Governança SaaS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = path.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
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
              })}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Auditoria"
                  className="strategos-nav-item h-10 rounded-lg"
                >
                  <span className={cn("flex items-center gap-3", collapsed && "justify-center gap-0")}>
                    <Shield className="h-5 w-5 shrink-0" />
                    <span className={cn(collapsed && "sr-only")}>Auditoria</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className={cn("mt-auto gap-3 border-0", collapsed ? "items-center p-2" : "p-3")}
      >
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
                <AvatarFallback className="sidebar-profile-avatar text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="sidebar-user-name truncate text-sm font-semibold">
                      {profile?.full_name ?? "Super Admin"}
                    </p>
                    <p className="sidebar-user-email truncate text-xs">
                      {userEmail || "Plataforma"}
                    </p>
                  </div>
                  <ChevronsUpDown className="sidebar-user-chevron h-4 w-4 shrink-0" aria-hidden />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => void handleLogout()}>
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
