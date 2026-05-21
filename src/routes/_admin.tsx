import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Toaster } from "@/components/ui/sonner";
import { loadAuthContext } from "@/lib/supabase/session";

export const Route = createFileRoute("/_admin")({
  path: "/admin",
  beforeLoad: async ({ context }) => {
    const auth = await loadAuthContext();
    if (!auth.session) throw redirect({ to: "/login" });
    if (auth.profile?.platform_role !== "super_admin") {
      throw redirect({ to: "/dashboard" });
    }
    return {
      ...context,
      session: auth.session,
      user: auth.user,
      profile: auth.profile,
      tenants: auth.tenants,
      activeTenant: auth.activeTenant,
    };
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <AppNavbar />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </SidebarInset>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
