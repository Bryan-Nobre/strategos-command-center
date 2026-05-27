import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { notifySupporterImportCompleted } from "@/services/notifications";
import { planLimitUserMessage } from "@/lib/plan-errors";
import * as supportersService from "@/services/supporters";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export function useSupporters(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.supporters(tenantId),
    queryFn: () => supportersService.listSupporters(tenantId),
    enabled: !!tenantId,
  });
}

export function useSupportersByLeadership(tenantId: string, leadershipId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.supporters(tenantId), "leadership", leadershipId],
    queryFn: () => supportersService.listSupportersByLeadership(tenantId, leadershipId!),
    enabled: !!tenantId && !!leadershipId,
  });
}

export function useCreateSupporter(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TablesInsert<"supporters">, "tenant_id">) =>
      supportersService.createSupporter(tenantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.supporters(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.operationalDashboard(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.planUsage(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.leaderships(tenantId) });
      toast.success("Apoiador cadastrado");
    },
    onError: (e: Error) => toast.error(planLimitUserMessage(e)),
  });
}

export function useUpdateSupporter(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: TablesUpdate<"supporters"> & { id: string }) =>
      supportersService.updateSupporter(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.supporters(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.leaderships(tenantId) });
      toast.success("Apoiador atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSupporter(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supportersService.deleteSupporter(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.supporters(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(tenantId) });
      toast.success("Apoiador removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useImportSupporters(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rows,
    }: {
      rows: supportersService.SupporterImportRow[];
      skipped: number;
    }) => supportersService.importSupporters(tenantId, rows),
    onSuccess: async (result, { skipped }) => {
      qc.invalidateQueries({ queryKey: queryKeys.supporters(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.operationalDashboard(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.planUsage(tenantId) });
      if (result.imported > 0) {
        try {
          await notifySupporterImportCompleted(tenantId, result.imported);
          void qc.invalidateQueries({ queryKey: queryKeys.notifications(tenantId) });
          void qc.invalidateQueries({ queryKey: queryKeys.notificationCount(tenantId) });
        } catch {
          /* notificação é complementar; import já concluiu */
        }
      }
      toast.success(`${result.imported} apoiador(es) importado(s)`);
      if (skipped > 0) {
        toast.warning(
          `${skipped} linha(s) não importada(s): limite de apoiadores do plano atingido.`,
        );
      }
    },
    onError: (e: Error) => toast.error(planLimitUserMessage(e)),
  });
}
