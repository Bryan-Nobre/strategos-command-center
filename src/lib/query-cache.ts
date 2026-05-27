import type { QueryClient } from "@tanstack/react-query";
import { isTenantScopedQueryKey } from "@/lib/query-keys";

export function clearTenantScopedCache(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => isTenantScopedQueryKey(query.queryKey),
  });
}
