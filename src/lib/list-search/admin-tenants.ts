import { Constants } from "@/types/supabase";
import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";

const STATUSES = Constants.public.Enums.tenant_status;
const PLANS = Constants.public.Enums.tenant_plan;

export type AdminTenantsListSearch = {
  busca?: string;
  status?: string;
  plano?: string;
};

export function parseAdminTenantsSearch(raw: Record<string, unknown>): AdminTenantsListSearch {
  const plano = pickEnum(raw.plano ?? raw.plan, PLANS);
  return omitEmpty({
    busca: trimParam(raw.busca),
    status: pickEnum(raw.status, STATUSES),
    plano,
  }) as AdminTenantsListSearch;
}

export function serializeAdminTenantsSearch(
  filters: AdminTenantsListSearch,
): AdminTenantsListSearch {
  return omitEmpty({
    busca: trimParam(filters.busca),
    status: pickEnum(filters.status, STATUSES),
    plano: pickEnum(filters.plano, PLANS),
  }) as AdminTenantsListSearch;
}

/** Filtros enviados à API (status/plano no servidor; busca só no cliente). */
export function adminTenantsApiFilters(search: AdminTenantsListSearch): {
  status?: (typeof STATUSES)[number];
  plan?: (typeof PLANS)[number];
} {
  return {
    status: pickEnum(search.status, STATUSES),
    plan: pickEnum(search.plano, PLANS),
  };
}
