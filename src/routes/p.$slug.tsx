import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { resolveLandingPublicCode } from "@/services/landing";

/** Compatibilidade: links antigos /p/{slug} redirecionam para /landpage/{public_code}. */
export const Route = createFileRoute("/p/$slug")({
  beforeLoad: async ({ params }) => {
    const code = await resolveLandingPublicCode(params.slug);
    if (!code) throw notFound();
    throw redirect({
      to: "/landpage/$code",
      params: { code },
      replace: true,
    });
  },
});
