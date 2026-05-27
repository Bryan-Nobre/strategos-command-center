import { Constants } from "@/types/supabase";
import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";
import { parseDeepLinkSearch } from "@/lib/search-deep-link";

const STATUSES = Constants.public.Enums.supporter_status;
const SUPPORT_LEVELS = Constants.public.Enums.support_level;

export type EleitoresListSearch = {
  busca?: string;
  id?: string;
  bairro?: string;
  status?: string;
  lideranca?: string;
  apoio?: string;
  tag?: string;
};

export function parseEleitoresSearch(raw: Record<string, unknown>): EleitoresListSearch {
  const deep = parseDeepLinkSearch(raw);
  const status = pickEnum(raw.status, STATUSES);
  const apoio = pickEnum(raw.apoio, SUPPORT_LEVELS);
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
  }) as EleitoresListSearch;
}

export type EleitoresFilterState = {
  busca: string;
  status: string;
  bairro: string;
  lideranca: string;
  apoio: string;
  tag: string;
};

export function eleitoresSearchToFilterState(search: EleitoresListSearch): EleitoresFilterState {
  return {
    busca: search.busca ?? "",
    status: search.status ?? "all",
    bairro: search.bairro ?? "all",
    lideranca: search.lideranca ?? "all",
    apoio: search.apoio ?? "all",
    tag: search.tag ?? "",
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
  });
}
