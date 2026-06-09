import { createLazyFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { RoutePendingFallback } from "@/components/common/RoutePendingFallback";

export const Route = createLazyFileRoute("/_admin")({
  component: AdminLayout,
  pendingComponent: RoutePendingFallback,
});

function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <AppNavbar />
          <main className="app-main-shell min-w-0 w-full max-w-full flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
