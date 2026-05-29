import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { LeadershipNetworkSegmentId } from "@/lib/leadership-network";
import { fetchLeadershipOperationalDetail } from "@/services/leadership-operational-detail";

export type LeadershipNetworkQueryParams = {
  segment: LeadershipNetworkSegmentId;
  search: string;
  limit: number;
  offset: number;
};

export function useLeadershipOperationalDetail(
  tenantId: string,
  leadershipId: string | null,
  params: LeadershipNetworkQueryParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.leadershipOperationalDetail(tenantId, leadershipId ?? "", params),
    queryFn: () => fetchLeadershipOperationalDetail(leadershipId!, params),
    enabled: !!tenantId && !!leadershipId && enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
