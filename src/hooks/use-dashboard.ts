import { useQuery } from "@tanstack/react-query";
import * as dashboardService from "@/services/dashboard";

export function useDashboardMetrics(tenantId: string) {
  return useQuery({
    queryKey: ["dashboard", tenantId],
    queryFn: () => dashboardService.getDashboardMetrics(tenantId),
    enabled: !!tenantId,
  });
}

export function useActivities(tenantId: string) {
  return useQuery({
    queryKey: ["activities", tenantId],
    queryFn: () => dashboardService.listActivities(tenantId),
    enabled: !!tenantId,
  });
}

export function usePollSnapshots(tenantId: string) {
  return useQuery({
    queryKey: ["poll_snapshots", tenantId],
    queryFn: () => dashboardService.listPollSnapshots(tenantId),
    enabled: !!tenantId,
  });
}
