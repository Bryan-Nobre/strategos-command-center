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
    <Sidebar collapsible="icon" className="strategos-admin-sidebar transition-theme">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
            <Vote className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">Super Admin</span>
              <span className="text-[10px] uppercase tracking-widest text-sidebar-muted">
                Plataforma
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted/80">Governança SaaS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = path.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "strategos-nav-item strategos-admin-nav-item h-10",
                        active && "strategos-admin-nav-item",
                      )}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton className="strategos-nav-item h-10">
                  <Shield className="h-5 w-5" />
                  <span>Auditoria</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className={cn("mt-auto border-t border-sidebar-border", collapsed ? "items-center p-2" : "p-3")}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-theme hover:bg-sidebar-accent",
                collapsed && "w-auto justify-center p-2",
              )}
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-destructive/15 text-xs text-destructive">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-sidebar-foreground">
                      {profile?.full_name ?? "Super Admin"}
                    </p>
                    <p className="truncate text-xs text-sidebar-muted">{userEmail || "Plataforma"}</p>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-muted" aria-hidden />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => void handleLogout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
