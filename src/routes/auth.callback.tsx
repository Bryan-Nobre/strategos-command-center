import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LoadingState } from "@/components/common/LoadingState";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast.error(error.message);
          navigate({ to: "/login" });
          return;
        }
      }
      navigate({ to: "/dashboard" });
    })();
  }, [navigate]);

  return <LoadingState label="Autenticando..." />;
}
