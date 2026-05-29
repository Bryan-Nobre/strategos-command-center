import { createClient } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";
import { listChapaMetricsByLeadership } from "@/services/leadership-metrics";

export type LeadershipChapaRow = {
  id: string;
  tenant_id: string;
  leadership_id: string;
  name: string;
  subtitle: string | null;
  vote_weight: number;
  display_order: number;
  is_published: boolean;
  created_at: string;
  pledge_count?: number;
  pledged_votes?: number;
};

export async function listChapasByLeadership(tenantId: string, leadershipId: string) {
  const supabase = createClient();
  const [{ data, error }, metricsMap] = await Promise.all([
    supabase
      .from("leadership_chapas")
      .select("id, tenant_id, leadership_id, name, subtitle, vote_weight, display_order, is_published, created_at")
      .eq("tenant_id", tenantId)
      .eq("leadership_id", leadershipId)
      .order("display_order")
      .order("name"),
    listChapaMetricsByLeadership(tenantId, leadershipId),
  ]);
  if (error) throw error;

  return (data ?? []).map((c) => {
    const m = metricsMap.get(c.id);
    return {
      ...c,
      pledge_count: m?.pledge_count ?? 0,
      pledged_votes: m?.pledged_votes ?? 0,
    } satisfies LeadershipChapaRow;
  });
}

export async function createChapa(
  tenantId: string,
  payload: Omit<TablesInsert<"leadership_chapas">, "tenant_id">,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leadership_chapas")
    .insert({ ...payload, tenant_id: tenantId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChapa(id: string, payload: TablesUpdate<"leadership_chapas">) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leadership_chapas")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChapa(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("leadership_chapas").delete().eq("id", id);
  if (error) throw error;
}
