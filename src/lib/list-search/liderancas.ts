import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";
import { parseDeepLinkSearch } from "@/lib/search-deep-link";

export type LiderancasViewMode = "cards" | "table";

export type LiderancasListSearch = {
  busca?: string;
  id?: string;
  regiao?: string;
  view?: LiderancasViewMode;
};

export function parseLiderancasSearch(raw: Record<string, unknown>): LiderancasListSearch {
  const deep = parseDeepLinkSearch(raw);
  const view = pickEnum(raw.view, ["cards", "table"] as const) ?? "cards";
  return omitEmpty({
    busca: deep.busca,
    id: deep.id,
    regiao: trimParam(raw.regiao),
    view,
  }) as LiderancasListSearch;
}

export function serializeLiderancasSearch(filters: LiderancasListSearch): LiderancasListSearch {
  return omitEmpty({
    busca: trimParam(filters.busca),
    id: trimParam(filters.id),
    regiao: trimParam(filters.regiao),
    view: pickEnum(filters.view, ["cards", "table"] as const) ?? "cards",
  }) as LiderancasListSearch;
}

export type LiderancasFilterState = {
  busca: string;
  regiao: string;
  view: LiderancasViewMode;
};

export function liderancasSearchToFilterState(search: LiderancasListSearch): LiderancasFilterState {
  return {
    busca: search.busca ?? "",
    regiao: search.regiao ?? "all",
    view: search.view ?? "cards",
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
  });
}
