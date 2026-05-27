import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { TenantProvider } from "@/contexts/tenant-context";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { LoadingState } from "@/components/common/LoadingState";
import { TenantAccessBlocked } from "@/components/auth/TenantAccessBlocked";
import { ensureAppAuth } from "@/lib/supabase/auth-route";
import { isTenantOperational } from "@/lib/tenant-access";

export const Route = createFileRoute("/_app")({
  // Segurança real: RLS/backend — guard apenas UX
  beforeLoad: async ({ context, location }) => {
    return ensureAppAuth(context, location.href);
  },
  component: AppLayout,
});

function AppLayout() {
  const { tenants, activeTenant, profile, membershipRole } = Route.useRouteContext();
  useThemePreference(activeTenant?.id);

  if (!activeTenant && profile?.platform_role !== "super_admin") {
    return <LoadingState label="Carregando campanha..." />;
  }

  if (activeTenant && !isTenantOperational(activeTenant)) {
    return <TenantAccessBlocked tenant={activeTenant} />;
  }

  return (
    <TenantProvider tenants={tenants} activeTenant={activeTenant} membershipRole={membershipRole}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar isSuperAdmin={profile?.platform_role === "super_admin"} />
          <SidebarInset className="flex min-w-0 flex-1 flex-col">
            <AppNavbar />
            <main className="flex-1 px-4 py-7 md:px-8 md:py-9">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TenantProvider>
  );
}
