import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

const BUSCA_DEBOUNCE_MS = 300;

type UseSyncedListSearchOptions<TSearch> = {
  search: TSearch;
  serialize: (next: TSearch) => TSearch;
  debouncedTextKey?: keyof TSearch & string;
};

/**
 * Sincroniza filtros com a URL (bidirecional).
 * Segurança real: RLS no backend; URL é apenas UX/compartilhamento de vista.
 */
export function useSyncedListSearch<TSearch extends Record<string, unknown>>({
  search,
  serialize,
  debouncedTextKey = "busca" as keyof TSearch & string,
}: UseSyncedListSearchOptions<TSearch>) {
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const urlText =
    debouncedTextKey && typeof search[debouncedTextKey] === "string"
      ? (search[debouncedTextKey] as string)
      : "";

  const [localText, setLocalText] = useState(urlText);

  useEffect(() => {
    setLocalText(urlText);
  }, [urlText]);

  const pushSearch = useCallback(
    (next: TSearch, replace = true) => {
      const cleaned = serialize(next);
      void navigate({
        search: cleaned as never,
        replace,
      });
    },
    [navigate, serialize],
  );

  /** Substitui o search inteiro (sem merge com params antigos). */
  const setSearch = useCallback(
    (next: TSearch, replace = true) => {
      pushSearch(next, replace);
    },
    [pushSearch],
  );

  const patchSearch = useCallback(
    (patch: Partial<TSearch>, replace = true) => {
      const merged = { ...search, ...patch } as TSearch;
      for (const key of Object.keys(patch) as (keyof TSearch)[]) {
        if (patch[key] === undefined) {
          delete merged[key];
        }
      }
      pushSearch(serialize(merged), replace);
    },
    [pushSearch, search, serialize],
  );

  const setLocalTextAndUrl = useCallback(
    (value: string) => {
      setLocalText(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const patch = { [debouncedTextKey]: value.trim() || undefined } as Partial<TSearch>;
        patchSearch(patch, true);
      }, BUSCA_DEBOUNCE_MS);
    },
    [debouncedTextKey, patchSearch],
  );

  const clearHighlight = useCallback(() => {
    if ("id" in search && search.id) {
      const next = { ...search };
      delete next.id;
      pushSearch(serialize(next as TSearch));
    }
  }, [patchSearch, pushSearch, search, serialize]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const copyCurrentLink = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href);
  }, []);

  return {
    localText,
    setLocalText: setLocalTextAndUrl,
    patchSearch,
    pushSearch,
    setSearch,
    clearHighlight,
    copyCurrentLink,
  };
}
