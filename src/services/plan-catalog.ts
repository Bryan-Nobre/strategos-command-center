import { createClient } from "@/lib/supabase/client";
import type { PlanDefinitionRow, PlanHighlightStyle } from "@/lib/plan-display";

type RawPlanCatalogRow = {
  plan: PlanDefinitionRow["plan"];
  max_supporters: number | null;
  max_team_members: number | null;
  max_regions: number | null;
  exports_enabled: boolean;
  polls_enabled: boolean;
  tagline: string | null;
  price_label: string;
  is_highlighted: boolean;
  highlight_style: PlanHighlightStyle;
  is_listed: boolean;
};

function mapRow(raw: RawPlanCatalogRow): PlanDefinitionRow {
  return {
    plan: raw.plan,
    maxSupporters: raw.max_supporters,
    maxTeamMembers: raw.max_team_members,
    maxRegions: raw.max_regions,
    exportsEnabled: raw.exports_enabled,
    pollsEnabled: raw.polls_enabled,
    tagline: raw.tagline,
    priceLabel: raw.price_label ?? "",
    isHighlighted: raw.is_highlighted === true,
    highlightStyle: raw.highlight_style === "purple" ? "purple" : "blue",
    isListed: raw.is_listed !== false,
  };
}

/** Catálogo comercial de planos — leitura via RPC (SECURITY DEFINER). */
export async function listPlanCatalog(): Promise<PlanDefinitionRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_plan_limit_definitions");
  if (error) throw error;

  const rows = (data ?? []) as RawPlanCatalogRow[];
  return rows.map(mapRow);
}
