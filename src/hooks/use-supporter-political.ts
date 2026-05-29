import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getSupporterPoliticalDetail,
  listSupporterPoliticalSummaries,
} from "@/services/supporter-political";

export function useSupporterPoliticalSummaries(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.supporterPoliticalSummaries(tenantId),
    queryFn: () => listSupporterPoliticalSummaries(tenantId),
    enabled: !!tenantId,
  });
}

export function useSupporterPoliticalDetail(tenantId: string, supporterId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.supporterPoliticalDetail(tenantId, supporterId ?? ""),
    queryFn: () => getSupporterPoliticalDetail(tenantId, supporterId!),
    enabled: !!tenantId && !!supporterId,
  });
}
