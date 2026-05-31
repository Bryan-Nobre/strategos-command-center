import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LandingLgpdRevokePanel } from "@/components/landing/LandingLgpdRevokePanel";
import { resolveLandingLgpdConfig } from "@/lib/landing-lgpd";
import { getPublicLanding } from "@/services/landing";

export const Route = createFileRoute("/lgpd/$code/revogar")({
  component: LgpdRevogarPage,
});

function LgpdRevogarPage() {
  const { code } = Route.useParams();

  const { data: landing } = useQuery({
    queryKey: ["public-landing", code],
    queryFn: () => getPublicLanding(code),
  });

  if (!landing) return null;

  const lgpdConfig = resolveLandingLgpdConfig(landing, code);

  return <LandingLgpdRevokePanel config={lgpdConfig} publicCode={code} />;
}
