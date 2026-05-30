import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";
import type { AnalyticsPeriodPreset } from "@/lib/analytics-period";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type PesquisasListSearch = {
  period?: AnalyticsPeriodPreset;
  from?: string;
  to?: string;
  bairro?: string;
  cidade?: string;
};

export function parsePesquisasSearch(raw: Record<string, unknown>): PesquisasListSearch {
  const period = pickEnum(raw.period, ["today", "7d", "30d", "90d", "custom"] as const) ?? "30d";
  const from = trimParam(raw.from);
  const to = trimParam(raw.to);

  return omitEmpty({
    period,
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
    bairro: trimParam(raw.bairro),
    cidade: trimParam(raw.cidade),
  }) as PesquisasListSearch;
}

export function serializePesquisasSearch(filters: PesquisasListSearch): PesquisasListSearch {
  return omitEmpty({
    period: filters.period ?? "30d",
    from: filters.from,
    to: filters.to,
    bairro: trimParam(filters.bairro),
    cidade: trimParam(filters.cidade),
  }) as PesquisasListSearch;
}

export function pesquisasFiltersToRpcParams(search: PesquisasListSearch) {
  return {
    neighborhood: search.bairro || null,
    city: search.cidade || null,
    source: null,
    status: null,
    supportLevel: null,
    leadershipId: null,
    assignedTo: null,
  };
}
