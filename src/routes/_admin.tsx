import { createFileRoute } from "@tanstack/react-router";
import { ensureAdminAuth } from "@/lib/supabase/auth-route";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ context }) => {
    return ensureAdminAuth(context);
  },
});
