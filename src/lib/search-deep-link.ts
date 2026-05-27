/** Parâmetros de URL compartilhados pela busca global (deep links). */
export type DeepLinkSearch = {
  busca?: string;
  id?: string;
};

export function parseDeepLinkSearch(search: Record<string, unknown>): DeepLinkSearch {
  return {
    busca: typeof search.busca === "string" && search.busca.trim() ? search.busca.trim() : undefined,
    id: typeof search.id === "string" && search.id ? search.id : undefined,
  };
}

export const DEEP_LINK_HIGHLIGHT_CLASS = "ring-2 ring-primary/60 bg-primary/5 animate-in fade-in duration-300";
