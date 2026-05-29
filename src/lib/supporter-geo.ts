/** Estados visuais do pipeline geo (P1.3b). Segurança real: backend. */
export type SupporterGeoBadgeState = "geo_pending" | "geo_enrichment_failed" | "geo_enriched" | null;

export function resolveSupporterGeoBadgeState(input: {
  cep?: string | null;
  geo_pending?: boolean | null;
  geo_enrichment_failed?: boolean | null;
  geo_enriched_at?: string | null;
}): SupporterGeoBadgeState {
  if (input.geo_enrichment_failed) return "geo_enrichment_failed";
  if (input.geo_pending && input.cep) return "geo_pending";
  if (input.geo_enriched_at) return "geo_enriched";
  return null;
}

export const SUPPORTER_GEO_BADGE_LABELS: Record<
  Exclude<SupporterGeoBadgeState, null>,
  string
> = {
  geo_pending: "CEP pendente",
  geo_enrichment_failed: "Falha geo",
  geo_enriched: "Geo OK",
};
