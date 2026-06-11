/** Segmentos filtrados server-side (get_leadership_operational_detail). */
export const LEADERSHIP_NETWORK_SEGMENTS = [
  { id: "all", label: "Todos" },
  { id: "with_pledge", label: "Landpage" },
  { id: "crm_only", label: "Manual no CRM" },
] as const;

export type LeadershipNetworkSegmentId = (typeof LEADERSHIP_NETWORK_SEGMENTS)[number]["id"];

export type LeadershipNetworkViewMode = "table" | "blocks";

export const LEADERSHIP_NETWORK_PAGE_SIZE = 10;

export type LeadershipNetworkSupporterRow = {
  supporter_id: string;
  supporter_name: string;
  is_primary: boolean;
  relationship_type: string;
  source: string;
  weight: number;
  neighborhood: string | null;
  normalized_neighborhood?: string | null;
  city: string | null;
  chapa_names: string[];
  created_at: string;
  last_activity_at: string | null;
  activity_score?: number;
  engagement_status?: string | null;
  geo_pending?: boolean;
  geo_enrichment_failed?: boolean;
  geo_enriched_at?: string | null;
  cep?: string | null;
};

export type LeadershipNetworkTerritoryRow = {
  neighborhood: string;
  count: number;
  pct: number;
};

export type LeadershipOperationalDetailResponse = {
  summary: {
    total_in_network: number;
    primary_count: number;
    secondary_count: number;
    with_pledge_count: number;
    crm_only_count: number;
    weekly_growth: number;
    avg_weight: number;
    filtered_total: number;
    active_supporters_30d?: number;
    hot_supporters?: number;
    inactive_supporters?: number;
    avg_activity_score?: number;
    segment: string;
  };
  supporters: LeadershipNetworkSupporterRow[];
  territory: LeadershipNetworkTerritoryRow[];
  growth: {
    weekly_growth: number;
    filtered_total: number;
  };
};

/** Mapeia source do vínculo para badge de apoiador quando aplicável. */
export function linkSourceForBadge(source: string): string {
  if (source === "landing" || source === "manual" || source === "import") return source;
  if (source === "migration" || source === "system") return "landing";
  return "manual";
}
