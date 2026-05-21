import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { acceptInvitation } from "@/services/team";
import { setStoredTenantId, loadAuthContext } from "@/lib/supabase/session";
import { LoadingState } from "@/components/common/LoadingState";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  beforeLoad: async ({ params }) => {
    const auth = await loadAuthContext();
    if (!auth.session) {
      throw redirect({ to: "/login", search: { invite: params.token } });
    }
  },
  component: InviteAcceptPage,
});

function InviteAcceptPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    acceptInvitation(token)
      .then((tenantId) => {
        setStoredTenantId(tenantId);
        toast.success("Convite aceito!");
        navigate({ to: "/dashboard" });
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Convite inválido");
        navigate({ to: "/dashboard" });
      });
  }, [token, navigate]);

  return <LoadingState label="Aceitando convite..." />;
}
