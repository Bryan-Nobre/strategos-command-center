import { createFileRoute, redirect } from "@tanstack/react-router";
import { createClient } from "@/lib/supabase/client";
import { LoadingState } from "@/components/common/LoadingState";

export const Route = createFileRoute("/auth/callback")({
  beforeLoad: async () => {
    const supabase = createClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    }
    throw redirect({ to: "/dashboard" });
  },
  component: () => <LoadingState label="Autenticando..." />,
});
