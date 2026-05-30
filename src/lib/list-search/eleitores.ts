import { Constants } from "@/types/supabase";
import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";
import { parseDeepLinkSearch } from "@/lib/search-deep-link";
import type { EleitoresEngagementFilter } from "@/lib/supporter-engagement";

const STATUSES = Constants.public.Enums.supporter_status;
const SUPPORT_LEVELS = Constants.public.Enums.support_level;
const SOURCES = Constants.public.Enums.supporter_source;

export type EleitoresViewMode = "table" | "cards" | "landing";
export type EleitoresPeriodPreset = "all" | "today" | "7d" | "30d" | "90d" | "custom";

export type EleitoresListSearch = {
  busca?: string;
  id?: string;
  bairro?: string;
  status?: string;
  lideranca?: string;
  apoio?: string;
  tag?: string;
  origem?: string;
  view?: EleitoresViewMode;
  period?: EleitoresPeriodPreset;
  from?: string;
  to?: string;
  engagement?: EleitoresEngagementFilter;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ENGAGEMENT_FILTERS = [
  "all",
  "active_7d",
  "hot",
  "warm",
  "cold",
  "inactive",
] as const satisfies readonly EleitoresEngagementFilter[];

export function parseEleitoresSearch(raw: Record<string, unknown>): EleitoresListSearch {
  const deep = parseDeepLinkSearch(raw);
  const status = pickEnum(raw.status, STATUSES);
  const apoio = pickEnum(raw.apoio, SUPPORT_LEVELS);
  const origem = pickEnum(raw.origem, SOURCES);
  const view = pickEnum(raw.view, ["table", "cards", "landing"] as const) ?? "table";
  const period = pickEnum(raw.period, ["all", "today", "7d", "30d", "90d", "custom"] as const) ?? "all";
  const from = trimParam(raw.from);
  const to = trimParam(raw.to);
  const engagement = pickEnum(raw.engagement, ENGAGEMENT_FILTERS) ?? "all";
  const lideranca = trimParam(raw.lideranca);
  const validLideranca =
    lideranca === "none" || (lideranca && /^[0-9a-f-]{36}$/i.test(lideranca)) ? lideranca : undefined;

  return omitEmpty({
    busca: deep.busca,
    id: deep.id,
    bairro: trimParam(raw.bairro),
    status,
    lideranca: validLideranca,
    apoio,
    tag: trimParam(raw.tag),
    origem,
    view,
    period,
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
    engagement: engagement !== "all" ? engagement : undefined,
  }) as EleitoresListSearch;
}

export function serializeEleitoresSearch(filters: EleitoresListSearch): EleitoresListSearch {
  return omitEmpty({
    busca: trimParam(filters.busca),
    id: trimParam(filters.id),
    bairro: trimParam(filters.bairro),
    status: pickEnum(filters.status, STATUSES),
    lideranca:
      filters.lideranca === "none" || trimParam(filters.lideranca)
        ? filters.lideranca === "none"
          ? "none"
          : trimParam(filters.lideranca)
        : undefined,
    apoio: pickEnum(filters.apoio, SUPPORT_LEVELS),
    tag: trimParam(filters.tag),
    origem: pickEnum(filters.origem, SOURCES),
    view: pickEnum(filters.view, ["table", "cards", "landing"] as const) ?? "table",
    period: pickEnum(filters.period, ["all", "today", "7d", "30d", "90d", "custom"] as const) ?? "all",
    from: filters.from,
    to: filters.to,
    engagement:
      pickEnum(filters.engagement, ENGAGEMENT_FILTERS) !== "all"
        ? pickEnum(filters.engagement, ENGAGEMENT_FILTERS)
        : undefined,
  }) as EleitoresListSearch;
}

export type EleitoresFilterState = {
  busca: string;
  status: string;
  bairro: string;
  lideranca: string;
  apoio: string;
  tag: string;
  origem: string;
  view: EleitoresViewMode;
  period: EleitoresPeriodPreset;
  from: string;
  to: string;
  engagement: EleitoresEngagementFilter;
};

export function eleitoresSearchToFilterState(search: EleitoresListSearch): EleitoresFilterState {
  return {
    busca: search.busca ?? "",
    status: search.status ?? "all",
    bairro: search.bairro ?? "all",
    lideranca: search.lideranca ?? "all",
    apoio: search.apoio ?? "all",
    tag: search.tag ?? "",
    origem: search.origem ?? "all",
    view: search.view ?? "table",
    period: search.period ?? "all",
    from: search.from ?? "",
    to: search.to ?? "",
    engagement: search.engagement ?? "all",
  };
}

export function filterStateToEleitoresSearch(
  state: EleitoresFilterState,
  highlightId?: string,
): EleitoresListSearch {
  return serializeEleitoresSearch({
    busca: state.busca || undefined,
    id: highlightId,
    bairro: state.bairro !== "all" ? state.bairro : undefined,
    status: state.status !== "all" ? state.status : undefined,
    lideranca: state.lideranca !== "all" ? state.lideranca : undefined,
    apoio: state.apoio !== "all" ? state.apoio : undefined,
    tag: state.tag || undefined,
    origem: state.origem !== "all" ? state.origem : undefined,
    view: state.view,
    period: state.period !== "all" ? state.period : undefined,
    from: state.period === "custom" && state.from ? state.from : undefined,
    to: state.period === "custom" && state.to ? state.to : undefined,
    engagement: state.engagement !== "all" ? state.engagement : undefined,
  });
}
