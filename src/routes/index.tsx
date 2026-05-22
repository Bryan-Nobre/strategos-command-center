import { createFileRoute } from "@tanstack/react-router";
import { ensurePublicAuthRedirect } from "@/lib/supabase/auth-route";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    return ensurePublicAuthRedirect(context, "index");
  },
});
