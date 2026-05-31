import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LandingLgpdTermContent } from "@/components/landing/LandingLgpdTermContent";
import { resolveLandingLgpdConfig } from "@/lib/landing-lgpd";
import { getPublicLanding } from "@/services/landing";

export const Route = createFileRoute("/lgpd/$code/termo")({
  component: LgpdTermoPage,
});

function LgpdTermoPage() {
  const { code } = Route.useParams();

  const { data: landing } = useQuery({
    queryKey: ["public-landing", code],
    queryFn: () => getPublicLanding(code),
  });

  if (!landing) return null;

  const lgpdConfig = resolveLandingLgpdConfig(landing, code);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Termo de Consentimento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Leia atentamente antes de autorizar o tratamento dos seus dados no cadastro de apoio.
        </p>
      </div>
      <LandingLgpdTermContent config={lgpdConfig} />
    </div>
  );
}
