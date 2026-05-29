import { createClient } from "@/lib/supabase/client";

/** Métricas server-side (view leadership_political_metrics_v). */
export type LeadershipPoliticalMetrics = {
  tenant_id: string;
  leadership_id: string;
  total_relationships: number;
  unique_supporters: number;
  linked_supporters_count: number;
  primary_supporters_count: number;
  pledged_supporters_count: number;
  pledged_votes: number;
  pledge_links_count: number;
  manual_links_count: number;
  chapa_count: number;
};

export async function listLeadershipPoliticalMetrics(
  tenantId: string,
): Promise<Map<string, LeadershipPoliticalMetrics>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leadership_political_metrics_v")
    .select(
      "tenant_id, leadership_id, total_relationships, unique_supporters, linked_supporters_count, primary_supporters_count, pledged_supporters_count, pledged_votes, pledge_links_count, manual_links_count, chapa_count",
    )
    .eq("tenant_id", tenantId);
  if (error) throw error;

  const map = new Map<string, LeadershipPoliticalMetrics>();
  for (const row of data ?? []) {
    map.set(row.leadership_id, row as LeadershipPoliticalMetrics);
  }
  return map;
}

export type LeadershipChapaMetrics = {
  chapa_id: string;
  pledge_count: number;
  pledged_votes: number;
};

export async function listChapaMetricsByLeadership(
  tenantId: string,
  leadershipId: string,
): Promise<Map<string, LeadershipChapaMetrics>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leadership_chapa_metrics_v")
    .select("chapa_id, pledge_count, pledged_votes")
    .eq("tenant_id", tenantId)
    .eq("leadership_id", leadershipId);
  if (error) throw error;

  const map = new Map<string, LeadershipChapaMetrics>();
  for (const row of data ?? []) {
    map.set(row.chapa_id, row as LeadershipChapaMetrics);
  }
  return map;
}
