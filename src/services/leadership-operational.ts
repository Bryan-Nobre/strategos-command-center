import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/supabase";

/**
 * Score heurístico operacional (ver view SQL).
 * Não representa projeção eleitoral oficial.
 */
export type LeadershipOperationalRow = {
  tenant_id: string;
  leadership_id: string;
  name: string;
  leadership_region: string | null;
  estimated_votes: number;
  actor_type: Enums<"leadership_actor_type">;
  supporter_id: string | null;
  created_at: string;
  linked_supporters: number;
  primary_supporters: number;
  secondary_supporters: number;
  pledged_votes: number;
  pledged_supporters_count: number;
  chapa_count: number;
  pledge_links_count: number;
  manual_links_count: number;
  weekly_growth: number;
  top_neighborhood: string | null;
  top_neighborhood_count: number | null;
  top_neighborhood_concentration_pct: number | null;
  landing_only_network: boolean;
  /** Soma dos pesos dos vínculos (fonte canônica de pontuação). */
  total_points: number;
  /** Alias de total_points — compatibilidade legada. */
  political_strength_score: number;
  active_supporters_30d?: number;
  hot_supporters?: number;
  inactive_supporters?: number;
  avg_activity_score?: number;
  cold_network_pct?: number | null;
};

const OPERATIONAL_SELECT =
  "tenant_id, leadership_id, name, leadership_region, estimated_votes, actor_type, supporter_id, created_at, linked_supporters, primary_supporters, secondary_supporters, pledged_votes, pledged_supporters_count, chapa_count, pledge_links_count, manual_links_count, weekly_growth, active_supporters_30d, hot_supporters, inactive_supporters, avg_activity_score, cold_network_pct, top_neighborhood, top_neighborhood_count, top_neighborhood_concentration_pct, landing_only_network, total_points, political_strength_score";

export async function listLeadershipOperationalSummary(
  tenantId: string,
): Promise<LeadershipOperationalRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leadership_operational_summary_v")
    .select(OPERATIONAL_SELECT)
    .eq("tenant_id", tenantId)
    .order("total_points", { ascending: false })
    .order("name");
  if (error) throw error;
  return (data ?? []) as LeadershipOperationalRow[];
}
