import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { searchTenant } from "@/services/global-search";

const MIN_QUERY_LENGTH = 2;

export function useGlobalSearch(tenantId: string, query: string, enabled: boolean) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: queryKeys.globalSearch(tenantId, trimmed),
    queryFn: () => searchTenant(tenantId, trimmed),
    enabled: enabled && !!tenantId && trimmed.length >= MIN_QUERY_LENGTH,
    staleTime: 30_000,
  });
}

export { MIN_QUERY_LENGTH as GLOBAL_SEARCH_MIN_LENGTH };
