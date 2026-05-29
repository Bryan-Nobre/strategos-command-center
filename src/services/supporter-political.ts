import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/supabase";

export type SupporterPoliticalSummary = {
  supporter_id: string;
  tenant_id: string;
  primary_leadership_id: string | null;
  primary_leadership_name: string | null;
  link_count: number;
  leadership_names: string[];
  leadership_ids: string[];
  has_primary_link: boolean;
};

export type SupporterPoliticalLinkDetail = {
  id: string;
  leadership_id: string;
  leadership_name: string;
  relationship_type: Enums<"supporter_leadership_relationship">;
  weight: number;
  is_primary: boolean;
  source: Enums<"supporter_leadership_link_source">;
};

export type SupporterChapaPledgeDetail = {
  chapa_id: string;
  chapa_name: string;
  leadership_id: string;
  leadership_name: string;
  vote_weight: number;
  pledged_at: string;
};

export async function listSupporterPoliticalSummaries(
  tenantId: string,
): Promise<Map<string, SupporterPoliticalSummary>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supporter_political_summary_v")
    .select(
      "supporter_id, tenant_id, primary_leadership_id, primary_leadership_name, link_count, leadership_names, leadership_ids, has_primary_link",
    )
    .eq("tenant_id", tenantId);
  if (error) throw error;

  const map = new Map<string, SupporterPoliticalSummary>();
  for (const row of data ?? []) {
    map.set(row.supporter_id, {
      ...row,
      leadership_names: row.leadership_names ?? [],
      leadership_ids: row.leadership_ids ?? [],
    } as SupporterPoliticalSummary);
  }
  return map;
}

export async function getSupporterPoliticalDetail(
  tenantId: string,
  supporterId: string,
): Promise<{
  links: SupporterPoliticalLinkDetail[];
  pledges: SupporterChapaPledgeDetail[];
}> {
  const supabase = createClient();

  const { data: linksRaw, error: linksError } = await supabase
    .from("supporter_leadership_links")
    .select("id, leadership_id, relationship_type, weight, is_primary, source")
    .eq("tenant_id", tenantId)
    .eq("supporter_id", supporterId)
    .order("is_primary", { ascending: false })
    .order("weight", { ascending: false });
  if (linksError) throw linksError;

  const leadershipIds = [...new Set((linksRaw ?? []).map((l) => l.leadership_id))];
  const leadershipNames = new Map<string, string>();
  if (leadershipIds.length > 0) {
    const { data: leaderships, error: lErr } = await supabase
      .from("leaderships")
      .select("id, name")
      .in("id", leadershipIds);
    if (lErr) throw lErr;
    for (const l of leaderships ?? []) leadershipNames.set(l.id, l.name);
  }

  const links: SupporterPoliticalLinkDetail[] = (linksRaw ?? []).map((row) => ({
    id: row.id,
    leadership_id: row.leadership_id,
    leadership_name: leadershipNames.get(row.leadership_id) ?? "—",
    relationship_type: row.relationship_type,
    weight: row.weight,
    is_primary: row.is_primary,
    source: row.source,
  }));

  const { data: pledgesRaw, error: pledgesError } = await supabase
    .from("supporter_chapa_pledges")
    .select("chapa_id, created_at")
    .eq("tenant_id", tenantId)
    .eq("supporter_id", supporterId)
    .order("created_at", { ascending: false });
  if (pledgesError) throw pledgesError;

  const chapaIds = [...new Set((pledgesRaw ?? []).map((p) => p.chapa_id))];
  const chapaById = new Map<
    string,
    { name: string; vote_weight: number; leadership_id: string }
  >();
  if (chapaIds.length > 0) {
    const { data: chapas, error: cErr } = await supabase
      .from("leadership_chapas")
      .select("id, name, vote_weight, leadership_id")
      .in("id", chapaIds);
    if (cErr) throw cErr;
    for (const c of chapas ?? []) {
      chapaById.set(c.id, c);
      if (!leadershipNames.has(c.leadership_id)) {
        leadershipIds.push(c.leadership_id);
      }
    }
  }

  const missingLeadershipIds = [...new Set((pledgesRaw ?? []).map((p) => chapaById.get(p.chapa_id)?.leadership_id).filter(Boolean) as string[])].filter(
    (id) => !leadershipNames.has(id),
  );
  if (missingLeadershipIds.length > 0) {
    const { data: extraLeaderships, error: elErr } = await supabase
      .from("leaderships")
      .select("id, name")
      .in("id", missingLeadershipIds);
    if (elErr) throw elErr;
    for (const l of extraLeaderships ?? []) leadershipNames.set(l.id, l.name);
  }

  const pledges: SupporterChapaPledgeDetail[] = (pledgesRaw ?? [])
    .map((row) => {
      const chapa = chapaById.get(row.chapa_id);
      if (!chapa) return null;
      return {
        chapa_id: row.chapa_id,
        chapa_name: chapa.name,
        leadership_id: chapa.leadership_id,
        leadership_name: leadershipNames.get(chapa.leadership_id) ?? "—",
        vote_weight: chapa.vote_weight,
        pledged_at: row.created_at,
      };
    })
    .filter((p): p is SupporterChapaPledgeDetail => p !== null);

  return { links, pledges };
}
