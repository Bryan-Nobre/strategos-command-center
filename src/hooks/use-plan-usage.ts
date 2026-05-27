import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getTenantPlanUsage } from "@/services/plan-usage";

export function usePlanUsage(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.planUsage(tenantId),
    queryFn: () => getTenantPlanUsage(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}
