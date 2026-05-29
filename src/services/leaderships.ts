import { createClient } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export async function listLeaderships(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leaderships")
    .select("id, name, region, estimated_votes, supporter_id, created_at")
    .eq("tenant_id", tenantId)
    .order("estimated_votes", { ascending: false });
  if (error) throw error;

  const { data: counts } = await supabase
    .from("supporters")
    .select("leadership_id")
    .eq("tenant_id", tenantId)
    .not("leadership_id", "is", null);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    if (row.leadership_id) {
      countMap.set(row.leadership_id, (countMap.get(row.leadership_id) ?? 0) + 1);
    }
  }

  const leadershipIds = (data ?? []).map((l) => l.id);
  const pledgedMap = new Map<string, number>();
  const chapaCountMap = new Map<string, number>();

  if (leadershipIds.length > 0) {
    const { data: chapaRows, error: chapaError } = await supabase
      .from("leadership_chapas")
      .select("id, leadership_id, vote_weight")
      .eq("tenant_id", tenantId)
      .in("leadership_id", leadershipIds);
    if (chapaError) throw chapaError;

    for (const c of chapaRows ?? []) {
      chapaCountMap.set(c.leadership_id, (chapaCountMap.get(c.leadership_id) ?? 0) + 1);
    }

    const allChapaIds = (chapaRows ?? []).map((c) => c.id);
    if (allChapaIds.length > 0) {
      const { data: pledges, error: pledgeError } = await supabase
        .from("supporter_chapa_pledges")
        .select("chapa_id")
        .eq("tenant_id", tenantId)
        .in("chapa_id", allChapaIds);
      if (pledgeError) throw pledgeError;

      const leadershipByChapa = new Map(
        (chapaRows ?? []).map((c) => [c.id, { leadership_id: c.leadership_id, vote_weight: c.vote_weight }]),
      );
      for (const p of pledges ?? []) {
        const chapa = leadershipByChapa.get(p.chapa_id);
        if (!chapa) continue;
        pledgedMap.set(
          chapa.leadership_id,
          (pledgedMap.get(chapa.leadership_id) ?? 0) + chapa.vote_weight,
        );
      }
    }
  }

  return (data ?? []).map((l) => ({
    ...l,
    apoiadores: countMap.get(l.id) ?? 0,
    pledged_votes: pledgedMap.get(l.id) ?? 0,
    chapa_count: chapaCountMap.get(l.id) ?? 0,
  }));
}

export async function createLeadership(
  tenantId: string,
  payload: Omit<TablesInsert<"leaderships">, "tenant_id">,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leaderships")
    .insert({ ...payload, tenant_id: tenantId })
    .select()
    .single();
  if (error) throw error;
  await supabase.rpc("log_activity", {
    p_tenant_id: tenantId,
    p_message: `Nova liderança: ${payload.name}`,
    p_entity_type: "leadership",
    p_entity_id: data.id,
  });
  return data;
}

export async function updateLeadership(id: string, payload: TablesUpdate<"leaderships">) {
  const supabase = createClient();
  const { data, error } = await supabase.from("leaderships").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** Remove vínculos de apoiadores e exclui a liderança. Segurança real: RLS/backend. */
export async function deleteLeadership(id: string) {
  const supabase = createClient();
  await supabase.from("supporters").update({ leadership_id: null }).eq("leadership_id", id);
  const { error } = await supabase.from("leaderships").delete().eq("id", id);
  if (error) throw error;
}
