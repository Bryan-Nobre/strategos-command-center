import { omitEmpty, trimParam } from "@/lib/list-search/utils";
import { parseDeepLinkSearch } from "@/lib/search-deep-link";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type AgendaListSearch = {
  busca?: string;
  id?: string;
  data?: string;
};

export function parseAgendaSearch(raw: Record<string, unknown>): AgendaListSearch {
  const deep = parseDeepLinkSearch(raw);
  const data = trimParam(raw.data);
  return omitEmpty({
    busca: deep.busca,
    id: deep.id,
    data: data && ISO_DATE.test(data) ? data : undefined,
  }) as AgendaListSearch;
}

export function serializeAgendaSearch(filters: AgendaListSearch): AgendaListSearch {
  return omitEmpty({
    busca: trimParam(filters.busca),
    id: trimParam(filters.id),
    data: trimParam(filters.data),
  }) as AgendaListSearch;
}
