import { createClient } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";
import {
  listLeadershipOperationalSummary,
  type LeadershipOperationalRow,
} from "@/services/leadership-operational";

export type LeadershipListItem = LeadershipOperationalRow & {
  /** Alias de leadership_id — compatibilidade com selects e deep links legados */
  id: string;
  /** @deprecated Use leadership_region */
  region: string | null;
  /** Apoiadores na rede (alias de linked_supporters) */
  apoiadores: number;
};

export async function listLeaderships(tenantId: string): Promise<LeadershipListItem[]> {
  const rows = await listLeadershipOperationalSummary(tenantId);
  return rows.map((l) => ({
    ...l,
    id: l.leadership_id,
    region: l.leadership_region,
    apoiadores: l.linked_supporters,
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
  const { error } = await supabase.from("leaderships").delete().eq("id", id);
  if (error) throw error;
}
