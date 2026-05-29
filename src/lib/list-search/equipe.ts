import { omitEmpty, trimParam } from "@/lib/list-search/utils";

export type EquipeListSearch = {
  busca?: string;
};

export function parseEquipeSearch(raw: Record<string, unknown>): EquipeListSearch {
  return omitEmpty({
    busca: trimParam(raw.busca),
  }) as EquipeListSearch;
}

export function serializeEquipeSearch(filters: EquipeListSearch): EquipeListSearch {
  return omitEmpty({
    busca: trimParam(filters.busca),
  }) as EquipeListSearch;
}
