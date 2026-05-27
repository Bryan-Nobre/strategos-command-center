import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getReportsSummary, type ReportsQueryParams } from "@/services/reports";

export function useReportsSummary(params: ReportsQueryParams | null) {
  return useQuery({
    queryKey: params
      ? queryKeys.reportsSummary(params.tenantId, {
          from: params.from,
          to: params.to,
          neighborhood: params.neighborhood,
          city: params.city,
          source: params.source,
          status: params.status,
          supportLevel: params.supportLevel,
          leadershipId: params.leadershipId,
          assignedTo: params.assignedTo,
        })
      : ["reports-summary", "disabled"],
    queryFn: () => getReportsSummary(params!),
    enabled: !!params?.tenantId && !!params.from && !!params.to,
    staleTime: 60_000,
  });
}
