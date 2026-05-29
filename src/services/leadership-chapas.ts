import { createClient } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

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
  const { data, error } = await supabase
    .from("leadership_chapas")
    .select("id, tenant_id, leadership_id, name, subtitle, vote_weight, display_order, is_published, created_at")
    .eq("tenant_id", tenantId)
    .eq("leadership_id", leadershipId)
    .order("display_order")
    .order("name");
  if (error) throw error;

  const chapaIds = (data ?? []).map((c) => c.id);
  if (!chapaIds.length) return [] as LeadershipChapaRow[];

  const { data: pledges, error: pledgeError } = await supabase
    .from("supporter_chapa_pledges")
    .select("chapa_id")
    .in("chapa_id", chapaIds);
  if (pledgeError) throw pledgeError;

  const countMap = new Map<string, number>();
  for (const p of pledges ?? []) {
    countMap.set(p.chapa_id, (countMap.get(p.chapa_id) ?? 0) + 1);
  }

  return (data ?? []).map((c) => ({
    ...c,
    pledge_count: countMap.get(c.id) ?? 0,
    pledged_votes: (countMap.get(c.id) ?? 0) * c.vote_weight,
  }));
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
