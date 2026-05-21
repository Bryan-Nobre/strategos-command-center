import { createFileRoute, redirect } from "@tanstack/react-router";
import { loadAuthContext } from "@/lib/supabase/session";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const auth = await loadAuthContext();
    if (auth.session && auth.profile?.platform_role === "super_admin") {
      throw redirect({ to: "/admin/tenants" });
    }
    if (auth.session && auth.activeTenant) throw redirect({ to: "/dashboard" });
    if (auth.session) throw redirect({ to: "/signup" });
    throw redirect({ to: "/login" });
  },
});
