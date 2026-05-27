import { omitEmpty, trimParam } from "@/lib/list-search/utils";
import { parseDeepLinkSearch } from "@/lib/search-deep-link";

export type LiderancasListSearch = {
  busca?: string;
  id?: string;
};

export function parseLiderancasSearch(raw: Record<string, unknown>): LiderancasListSearch {
  const deep = parseDeepLinkSearch(raw);
  return omitEmpty({
    busca: deep.busca,
    id: deep.id,
  }) as LiderancasListSearch;
}

export function serializeLiderancasSearch(filters: LiderancasListSearch): LiderancasListSearch {
  return omitEmpty({
    busca: trimParam(filters.busca),
    id: trimParam(filters.id),
  }) as LiderancasListSearch;
}
