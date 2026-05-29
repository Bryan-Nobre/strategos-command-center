import { Constants } from "@/types/supabase";
import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";
import { parseDeepLinkSearch } from "@/lib/search-deep-link";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TYPES = Constants.public.Enums.agenda_event_type;
const STATUSES = ["agendado", "confirmado", "realizado", "cancelado"] as const;
const VIEWS = ["dia", "semana", "lista"] as const;
const FILTERS = ["all", "com_apoiadores", "sem_apoiadores"] as const;

export type AgendaListSearch = {
  busca?: string;
  id?: string;
  data?: string;
  tipo?: string;
  status?: string;
  view?: string;
  filtro?: string;
};

export function parseAgendaSearch(raw: Record<string, unknown>): AgendaListSearch {
  const deep = parseDeepLinkSearch(raw);
  const data = trimParam(raw.data);
  return omitEmpty({
    busca: deep.busca,
    id: deep.id,
    data: data && ISO_DATE.test(data) ? data : undefined,
    tipo: pickEnum(raw.tipo, TYPES),
    status: pickEnum(raw.status, STATUSES),
    view: pickEnum(raw.view, VIEWS) ?? "dia",
    filtro: pickEnum(raw.filtro, FILTERS),
  }) as AgendaListSearch;
}

export function serializeAgendaSearch(filters: AgendaListSearch): AgendaListSearch {
  return omitEmpty({
    busca: trimParam(filters.busca),
    id: trimParam(filters.id),
    data: trimParam(filters.data),
    tipo: pickEnum(filters.tipo, TYPES),
    status: pickEnum(filters.status, STATUSES),
    view: pickEnum(filters.view, VIEWS),
    filtro: pickEnum(filters.filtro, FILTERS),
  }) as AgendaListSearch;
}

export type AgendaFilterState = {
  busca: string;
  data: string;
  tipo: string;
  status: string;
  view: string;
  filtro: string;
};

export function agendaSearchToFilterState(
  search: AgendaListSearch,
  defaultDate: string,
): AgendaFilterState {
  return {
    busca: search.busca ?? "",
    data: search.data ?? defaultDate,
    tipo: search.tipo ?? "all",
    status: search.status ?? "all",
    view: search.view ?? "dia",
    filtro: search.filtro ?? "all",
  };
}

export function filterStateToAgendaSearch(
  state: AgendaFilterState,
  highlightId?: string,
): AgendaListSearch {
  return serializeAgendaSearch({
    busca: state.busca || undefined,
    id: highlightId,
    data: state.data,
    tipo: state.tipo !== "all" ? state.tipo : undefined,
    status: state.status !== "all" ? state.status : undefined,
    view: state.view !== "dia" ? state.view : undefined,
    filtro: state.filtro !== "all" ? state.filtro : undefined,
  });
}
