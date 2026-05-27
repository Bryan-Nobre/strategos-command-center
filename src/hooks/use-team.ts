import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { listTeamMembers } from "@/services/team";

export function useTeamMembers(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.team(tenantId),
    queryFn: () => listTeamMembers(tenantId),
    enabled: !!tenantId,
  });
}
