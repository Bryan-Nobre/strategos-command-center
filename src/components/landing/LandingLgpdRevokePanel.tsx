import type { LandingLgpdConfig } from "@/lib/landing-lgpd";
import { landingLgpdRevokeUrl } from "@/lib/landing-lgpd-routes";

export function LandingLgpdRevokePanel({
  config,
  publicCode,
}: {
  config: LandingLgpdConfig;
  publicCode: string;
}) {
  const pageUrl = landingLgpdRevokeUrl(publicCode);

  return (
    <div className="space-y-5 text-sm leading-relaxed text-foreground/90">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Revogar consentimento</h2>
        <p className="mt-2 text-muted-foreground">
          Você pode revogar o consentimento fornecido no cadastro de apoio a qualquer momento.
        </p>
      </div>

      <p>
        Após a revogação, o envio de comunicações relacionadas à campanha de{" "}
        <strong>{config.controller_name}</strong> deverá cessar, ressalvadas as hipóteses legais de
        tratamento e o armazenamento necessário para cumprimento de obrigações legais ou regulatórias.
      </p>

      <section className="rounded-lg border border-border/80 bg-muted/30 p-4">
        <h3 className="text-sm font-semibold text-foreground">Como solicitar</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Envie um e-mail para{" "}
            {config.controller_email ? (
              <a
                href={`mailto:${config.controller_email}?subject=${encodeURIComponent("Revogação de consentimento LGPD")}`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {config.controller_email}
              </a>
            ) : (
              "o canal de atendimento indicado no termo de consentimento"
            )}
            .
          </li>
          <li>Informe seu nome completo e o telefone ou e-mail usados no cadastro de apoio.</li>
          <li>Solicite expressamente a revogação do consentimento para tratamento de dados.</li>
        </ol>
      </section>

      <p className="text-xs text-muted-foreground">
        Endereço desta página:{" "}
        <a
          href={pageUrl}
          className="break-all font-mono text-primary underline-offset-2 hover:underline"
        >
          {pageUrl}
        </a>
      </p>
    </div>
  );
}
