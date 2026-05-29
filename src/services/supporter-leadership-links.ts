import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/supabase";

export type SupporterLeadershipLinkRow = {
  id: string;
  tenant_id: string;
  supporter_id: string;
  leadership_id: string;
  relationship_type: Enums<"supporter_leadership_relationship">;
  weight: number;
  is_primary: boolean;
  source: Enums<"supporter_leadership_link_source">;
  created_at: string;
  updated_at: string;
};

export async function listSupporterLeadershipLinks(
  tenantId: string,
  filters?: { supporterId?: string; leadershipId?: string },
): Promise<SupporterLeadershipLinkRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("supporter_leadership_links")
    .select(
      "id, tenant_id, supporter_id, leadership_id, relationship_type, weight, is_primary, source, created_at, updated_at",
    )
    .eq("tenant_id", tenantId);

  if (filters?.supporterId) {
    query = query.eq("supporter_id", filters.supporterId);
  }
  if (filters?.leadershipId) {
    query = query.eq("leadership_id", filters.leadershipId);
  }

  const { data, error } = await query.order("is_primary", { ascending: false }).order("weight", {
    ascending: false,
  });
  if (error) throw error;
  return (data ?? []) as SupporterLeadershipLinkRow[];
}

/** Contagem distinta de apoiadores por liderança (fonte de verdade relacional). */
export async function countDistinctSupportersPerLeadership(
  tenantId: string,
): Promise<Map<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supporter_leadership_links")
    .select("leadership_id, supporter_id")
    .eq("tenant_id", tenantId);
  if (error) throw error;

  const counts = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const set = counts.get(row.leadership_id) ?? new Set<string>();
    set.add(row.supporter_id);
    counts.set(row.leadership_id, set);
  }

  const result = new Map<string, number>();
  for (const [leadershipId, set] of counts) {
    result.set(leadershipId, set.size);
  }
  return result;
}

export async function recomputeSupporterLeadershipPrimary(supporterId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("recompute_supporter_leadership_primary", {
    p_supporter_id: supporterId,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}
