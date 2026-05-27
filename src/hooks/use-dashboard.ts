import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import * as dashboardService from "@/services/dashboard";
import type { Enums, Json } from "@/types/supabase";

export function useDashboardMetrics(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.dashboard(tenantId),
    queryFn: () => dashboardService.getDashboardMetrics(tenantId),
    enabled: !!tenantId,
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

export function useStrategicInsights(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.strategicInsights(tenantId),
    queryFn: () => dashboardService.getStrategicInsights(tenantId),
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
      qc.invalidateQueries({ queryKey: queryKeys.strategicInsights(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(tenantId) });
      toast.success("Metas salvas");
    },
    onError: (e: Error) => toast.error(e.message),
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
    onError: (e: Error) => toast.error(e.message),
  });
}
