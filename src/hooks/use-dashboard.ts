import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { planLimitUserMessage } from "@/lib/plan-errors";
import * as dashboardService from "@/services/dashboard";
import type { Enums, Json } from "@/types/supabase";

export function useOperationalDashboard(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.operationalDashboard(tenantId),
    queryFn: () => dashboardService.getOperationalDashboard(tenantId),
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

/** Métricas resumidas — cache compartilhado com a RPC operacional. */
export function useDashboardMetrics(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.operationalDashboard(tenantId),
    queryFn: () => dashboardService.getOperationalDashboard(tenantId),
    enabled: !!tenantId,
    staleTime: 60_000,
    select: (data) => data.metrics,
  });
}

export function useActivities(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.activities(tenantId),
    queryFn: () => dashboardService.listActivities(tenantId),
    enabled: !!tenantId,
  });
}

export function usePollSnapshots(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.pollSnapshots(tenantId),
    queryFn: () => dashboardService.listPollSnapshots(tenantId),
    enabled: !!tenantId,
  });
}

export function useManualGoalsConfig(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.weeklyGoalsConfig(tenantId),
    queryFn: () => dashboardService.getManualGoalsConfig(tenantId),
    enabled: !!tenantId,
  });
}

export function useSaveManualGoalsConfig(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goals: dashboardService.ManualGoalConfig[]) =>
      dashboardService.saveManualGoalsConfig(tenantId, goals),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.weeklyGoalsConfig(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.operationalDashboard(tenantId) });
      toast.success("Metas salvas");
    },
    onError: (e: Error) => toast.error(planLimitUserMessage(e)),
  });
}

export function useUpsertPollSnapshot(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      snapshotType,
      data,
      title,
    }: {
      snapshotType: Enums<"poll_snapshot_type">;
      data: Json;
      title?: string;
    }) => dashboardService.upsertPollSnapshot(tenantId, snapshotType, data, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pollSnapshots(tenantId) });
      toast.success("Pesquisa salva");
    },
    onError: (e: Error) => toast.error(planLimitUserMessage(e)),
  });
}
