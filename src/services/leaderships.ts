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

  return (data ?? []).map((l) => ({
    ...l,
    apoiadores: countMap.get(l.id) ?? 0,
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
