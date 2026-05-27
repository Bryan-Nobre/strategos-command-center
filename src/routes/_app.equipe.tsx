import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { UsersRound, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import { PERMISSIONS_ADMIN_INTRO } from "@/lib/permission-field-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/equipe")({
  component: EquipeLayout,
});

const tabs = [
  { title: "Membros", href: "/equipe", icon: UsersRound },
  { title: "Cargos", href: "/equipe/cargos", icon: Shield },
];

function EquipeLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <ModuleRouteGuard module="team">
    <div className="space-y-6">
      <PageHeader title="Equipe" description={PERMISSIONS_ADMIN_INTRO} />

      <nav className="flex flex-wrap gap-2 border-b border-border/80 pb-4">
        {tabs.map((tab) => {
          const active = path === tab.href || (tab.href !== "/equipe" && path.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.title}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
    </ModuleRouteGuard>
  );
}
