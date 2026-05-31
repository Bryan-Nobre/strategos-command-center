import { createFileRoute, redirect } from "@tanstack/react-router";
import { resolveLandingPublicCode } from "@/services/landing";

/** Rota legada — redireciona para a área LGPD dedicada. */
export const Route = createFileRoute("/landpage/$code/termo")({
  beforeLoad: async ({ params }) => {
    const canonical = await resolveLandingPublicCode(params.code);
    const code = canonical ?? params.code.toLowerCase();
    throw redirect({
      to: "/lgpd/$code/termo",
      params: { code },
      replace: true,
    });
  },
});
