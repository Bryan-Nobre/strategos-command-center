import { Constants } from "@/types/supabase";
import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";
import { parseDeepLinkSearch } from "@/lib/search-deep-link";

const CATEGORIES = Constants.public.Enums.demand_category;
const STATUSES = Constants.public.Enums.demand_status;

export type DemandasListSearch = {
  busca?: string;
  id?: string;
  bairro?: string;
  categoria?: string;
  responsavel?: string;
  status?: string;
};

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

  return omitEmpty({
    busca: deep.busca,
    id: deep.id,
    bairro: trimParam(raw.bairro),
    categoria: pickEnum(raw.categoria, CATEGORIES),
    responsavel: validResponsavel,
    status: pickEnum(raw.status, STATUSES),
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
  }) as DemandasListSearch;
}

export type DemandasFilterState = {
  busca: string;
  bairro: string;
  categoria: string;
  responsavel: string;
  status: string;
};

export function demandasSearchToFilterState(search: DemandasListSearch): DemandasFilterState {
  return {
    busca: search.busca ?? "",
    bairro: search.bairro ?? "all",
    categoria: search.categoria ?? "all",
    responsavel: search.responsavel ?? "all",
    status: search.status ?? "all",
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
  });
}
