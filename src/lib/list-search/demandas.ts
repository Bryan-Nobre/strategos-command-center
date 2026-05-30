import { Constants } from "@/types/supabase";
import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";
import { parseDeepLinkSearch } from "@/lib/search-deep-link";
import type { DatePeriodPreset } from "@/lib/date-period";

const CATEGORIES = Constants.public.Enums.demand_category;
const STATUSES = Constants.public.Enums.demand_status;
const SOURCES = ["manual", "landing"] as const;

export type DemandasListSearch = {
  busca?: string;
  id?: string;
  bairro?: string;
  categoria?: string;
  responsavel?: string;
  status?: string;
  origem?: string;
  period?: DatePeriodPreset;
  from?: string;
  to?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PERIODS = ["all", "today", "7d", "30d", "90d", "custom"] as const;

export function parseDemandasSearch(raw: Record<string, unknown>): DemandasListSearch {
  const deep = parseDeepLinkSearch(raw);
  let responsavel = trimParam(raw.responsavel);

  if (
    raw.semResponsavel === "1" ||
    raw.semResponsavel === "true" ||
    raw.semResponsavel === true
  ) {
    responsavel = "none";
  }

  const validResponsavel =
    responsavel === "none" || (responsavel && /^[0-9a-f-]{36}$/i.test(responsavel))
      ? responsavel
      : undefined;

  const period = pickEnum(raw.period, PERIODS) ?? "all";
  const from = trimParam(raw.from);
  const to = trimParam(raw.to);

  return omitEmpty({
    busca: deep.busca,
    id: deep.id,
    bairro: trimParam(raw.bairro),
    categoria: pickEnum(raw.categoria, CATEGORIES),
    responsavel: validResponsavel,
    status: pickEnum(raw.status, STATUSES),
    origem: pickEnum(raw.origem, SOURCES),
    period: period !== "all" ? period : undefined,
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
  }) as DemandasListSearch;
}

export function serializeDemandasSearch(filters: DemandasListSearch): DemandasListSearch {
  return omitEmpty({
    busca: trimParam(filters.busca),
    id: trimParam(filters.id),
    bairro: trimParam(filters.bairro),
    categoria: pickEnum(filters.categoria, CATEGORIES),
    responsavel:
      filters.responsavel === "none" || trimParam(filters.responsavel)
        ? filters.responsavel === "none"
          ? "none"
          : trimParam(filters.responsavel)
        : undefined,
    status: pickEnum(filters.status, STATUSES),
    origem: pickEnum(filters.origem, SOURCES),
    period: pickEnum(filters.period, PERIODS) !== "all" ? pickEnum(filters.period, PERIODS) : undefined,
    from: filters.from,
    to: filters.to,
  }) as DemandasListSearch;
}

export type DemandasFilterState = {
  busca: string;
  bairro: string;
  categoria: string;
  responsavel: string;
  status: string;
  origem: string;
  period: DatePeriodPreset;
  from: string;
  to: string;
};

export function demandasSearchToFilterState(search: DemandasListSearch): DemandasFilterState {
  return {
    busca: search.busca ?? "",
    bairro: search.bairro ?? "all",
    categoria: search.categoria ?? "all",
    responsavel: search.responsavel ?? "all",
    status: search.status ?? "all",
    origem: search.origem ?? "all",
    period: search.period ?? "all",
    from: search.from ?? "",
    to: search.to ?? "",
  };
}

export function filterStateToDemandasSearch(
  state: DemandasFilterState,
  highlightId?: string,
): DemandasListSearch {
  return serializeDemandasSearch({
    busca: state.busca || undefined,
    id: highlightId,
    bairro: state.bairro !== "all" ? state.bairro : undefined,
    categoria: state.categoria !== "all" ? state.categoria : undefined,
    responsavel: state.responsavel !== "all" ? state.responsavel : undefined,
    status: state.status !== "all" ? state.status : undefined,
    origem: state.origem !== "all" ? state.origem : undefined,
    period: state.period !== "all" ? state.period : undefined,
    from: state.period === "custom" && state.from ? state.from : undefined,
    to: state.period === "custom" && state.to ? state.to : undefined,
  });
}
