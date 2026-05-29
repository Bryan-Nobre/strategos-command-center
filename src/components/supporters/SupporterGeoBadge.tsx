import { Badge } from "@/components/ui/badge";
import {
  resolveSupporterGeoBadgeState,
  SUPPORTER_GEO_BADGE_LABELS,
} from "@/lib/supporter-geo";
import { cn } from "@/lib/utils";

const VARIANTS = {
  geo_pending:
    "border-violet-500/40 bg-violet-500/10 text-[10px] font-medium text-violet-900 dark:text-violet-200",
  geo_enrichment_failed:
    "border-rose-500/50 bg-rose-500/10 text-[10px] font-medium text-rose-800 dark:text-rose-200",
  geo_enriched:
    "border-emerald-500/40 bg-emerald-500/10 text-[10px] font-medium text-emerald-800 dark:text-emerald-200",
} as const;

/** Status do pipeline de enriquecimento por CEP — cálculo real no backend. */
export function SupporterGeoBadge({
  cep,
  geo_pending,
  geo_enrichment_failed,
  geo_enriched_at,
  className,
}: {
  cep?: string | null;
  geo_pending?: boolean | null;
  geo_enrichment_failed?: boolean | null;
  geo_enriched_at?: string | null;
  className?: string;
}) {
  const state = resolveSupporterGeoBadgeState({
    cep,
    geo_pending,
    geo_enrichment_failed,
    geo_enriched_at,
  });
  if (!state) return null;

  return (
    <Badge variant="outline" className={cn(VARIANTS[state], className)}>
      {SUPPORTER_GEO_BADGE_LABELS[state]}
    </Badge>
  );
}
