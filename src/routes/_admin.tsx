import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ensureAdminAuth } from "@/lib/supabase/auth-route";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ context }) => {
    return ensureAdminAuth(context);
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
      </div>
    </SidebarProvider>
  );
}
