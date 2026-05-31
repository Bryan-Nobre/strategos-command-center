import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const revokeSearchSchema = z.object({
  campanha: z.string().optional(),
  code: z.string().optional(),
});

/** Rota legada — redireciona para LGPD da campanha quando informado o código. */
export const Route = createFileRoute("/revogar-consentimento")({
  validateSearch: revokeSearchSchema,
  beforeLoad: ({ search }) => {
    const code = (search.campanha ?? search.code)?.trim().toLowerCase();
    if (code) {
      throw redirect({
        to: "/lgpd/$code/revogar",
        params: { code },
        replace: true,
      });
    }
  },
  component: RevogarConsentimentoLegacyPage,
});

function RevogarConsentimentoLegacyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Revogação de consentimento</p>
        <p className="mt-2">
          Acesse o link de privacidade (LGPD) disponível na página da campanha em que você se
          cadastrou. O endereço segue o formato{" "}
          <span className="font-mono text-xs">/lgpd/código-da-campanha/revogar</span>.
        </p>
      </div>
    </div>
  );
}
