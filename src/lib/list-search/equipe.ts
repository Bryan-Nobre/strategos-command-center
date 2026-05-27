import { omitEmpty, trimParam } from "@/lib/list-search/utils";

export type EquipeTab = "membros" | "convites";

export type EquipeListSearch = {
  busca?: string;
  aba?: EquipeTab;
};

export function parseEquipeSearch(raw: Record<string, unknown>): EquipeListSearch {
  const aba = trimParam(raw.aba);
  return omitEmpty({
    busca: trimParam(raw.busca),
    aba: aba === "convites" ? "convites" : aba === "membros" ? "membros" : undefined,
  }) as EquipeListSearch;
}

export function serializeEquipeSearch(filters: EquipeListSearch): EquipeListSearch {
  return omitEmpty({
    busca: trimParam(filters.busca),
    aba: filters.aba === "convites" ? "convites" : undefined,
  }) as EquipeListSearch;
}
