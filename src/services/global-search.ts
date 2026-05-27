import { createClient } from "@/lib/supabase/client";
import type { SearchableModule } from "@/lib/search-module-meta";

export type GlobalSearchItem = {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  search: Record<string, string>;
};

export type GlobalSearchGroup = {
  module: SearchableModule;
  label: string;
  items: GlobalSearchItem[];
};

export type GlobalSearchResult = {
  query: string;
  groups: GlobalSearchGroup[];
};

type RawResponse = {
  query: string;
  groups: Array<{
    module: SearchableModule;
    label: string;
    items: GlobalSearchItem[];
  }>;
};

export async function searchTenant(
  tenantId: string,
  query: string,
  limitPerModule = 5,
): Promise<GlobalSearchResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_tenant", {
    p_tenant_id: tenantId,
    p_query: query.trim(),
    p_limit_per_module: limitPerModule,
  });
  if (error) throw error;

  const raw = data as RawResponse;
  return {
    query: raw.query ?? query.trim(),
    groups: raw.groups ?? [],
  };
}
