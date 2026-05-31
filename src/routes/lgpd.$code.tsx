import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LandingLgpdShell } from "@/components/landing/LandingLgpdShell";
import { LoadingState } from "@/components/common/LoadingState";
import { DEFAULT_LANDING_THEME, parseLandingTheme } from "@/lib/landing-theme";
import { getPublicLanding, resolveLandingPublicCode } from "@/services/landing";

export const Route = createFileRoute("/lgpd/$code")({
  beforeLoad: async ({ params }) => {
    const canonical = await resolveLandingPublicCode(params.code);
    if (canonical && canonical !== params.code.toLowerCase()) {
      throw redirect({
        to: "/lgpd/$code",
        params: { code: canonical },
        replace: true,
      });
    }
  },
  component: LgpdLayoutPage,
});

function LgpdLayoutPage() {
  const { code } = Route.useParams();

  const { data: landing, isLoading, error } = useQuery({
    queryKey: ["public-landing", code],
    queryFn: () => getPublicLanding(code),
  });

  if (isLoading) return <LoadingState />;
  if (error || !landing) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Informações LGPD não encontradas.</p>
      </div>
    );
  }

  const theme = landing.theme ?? parseLandingTheme(undefined) ?? DEFAULT_LANDING_THEME;

  return <LandingLgpdShell code={code} landing={landing} theme={theme} />;
}
