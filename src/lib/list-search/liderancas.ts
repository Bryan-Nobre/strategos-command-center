import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";
import { parseDeepLinkSearch } from "@/lib/search-deep-link";
import type { DatePeriodPreset } from "@/lib/date-period";

export type LiderancasViewMode = "cards" | "table";

export type LiderancasListSearch = {
  busca?: string;
  id?: string;
  regiao?: string;
  view?: LiderancasViewMode;
  period?: DatePeriodPreset;
  from?: string;
  to?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PERIODS = ["all", "today", "7d", "30d", "90d", "custom"] as const;

export function parseLiderancasSearch(raw: Record<string, unknown>): LiderancasListSearch {
  const deep = parseDeepLinkSearch(raw);
  const view = pickEnum(raw.view, ["cards", "table"] as const) ?? "cards";
  const period = pickEnum(raw.period, PERIODS) ?? "all";
  const from = trimParam(raw.from);
  const to = trimParam(raw.to);
  return omitEmpty({
    busca: deep.busca,
    id: deep.id,
    regiao: trimParam(raw.regiao),
    view,
    period: period !== "all" ? period : undefined,
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
  }) as LiderancasListSearch;
}

export function serializeLiderancasSearch(filters: LiderancasListSearch): LiderancasListSearch {
  return omitEmpty({
    busca: trimParam(filters.busca),
    id: trimParam(filters.id),
    regiao: trimParam(filters.regiao),
    view: pickEnum(filters.view, ["cards", "table"] as const) ?? "cards",
    period: pickEnum(filters.period, PERIODS) !== "all" ? pickEnum(filters.period, PERIODS) : undefined,
    from: filters.from,
    to: filters.to,
  }) as LiderancasListSearch;
}

export type LiderancasFilterState = {
  busca: string;
  regiao: string;
  view: LiderancasViewMode;
  period: DatePeriodPreset;
  from: string;
  to: string;
};

export function liderancasSearchToFilterState(search: LiderancasListSearch): LiderancasFilterState {
  return {
    busca: search.busca ?? "",
    regiao: search.regiao ?? "all",
    view: search.view ?? "cards",
    period: search.period ?? "all",
    from: search.from ?? "",
    to: search.to ?? "",
  };
}

export function filterStateToLiderancasSearch(
  state: LiderancasFilterState,
  highlightId?: string,
): LiderancasListSearch {
  return serializeLiderancasSearch({
    busca: state.busca || undefined,
    id: highlightId,
    regiao: state.regiao !== "all" ? state.regiao : undefined,
    view: state.view,
    period: state.period !== "all" ? state.period : undefined,
    from: state.period === "custom" && state.from ? state.from : undefined,
    to: state.period === "custom" && state.to ? state.to : undefined,
  });
}
