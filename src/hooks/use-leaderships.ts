import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import * as leadershipsService from "@/services/leaderships";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export function useLeaderships(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.leaderships(tenantId),
    queryFn: () => leadershipsService.listLeaderships(tenantId),
    enabled: !!tenantId,
    /** Vínculos podem mudar via triggers no backend sem passar pelo client. */
    staleTime: 60_000,
  });
}

export function useCreateLeadership(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TablesInsert<"leaderships">, "tenant_id">) =>
      leadershipsService.createLeadership(tenantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leaderships(tenantId) });
      void qc.invalidateQueries({ queryKey: queryKeys.supporterPoliticalSummaries(tenantId) });
      void qc.invalidateQueries({ queryKey: ["leadership-operational-detail", tenantId] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(tenantId) });
      toast.success("Liderança cadastrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLeadership(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: TablesUpdate<"leaderships"> & { id: string }) =>
      leadershipsService.updateLeadership(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leaderships(tenantId) });
      void qc.invalidateQueries({ queryKey: ["leadership-operational-detail", tenantId] });
      toast.success("Liderança atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLeadership(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadershipsService.deleteLeadership(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leaderships(tenantId) });
      void qc.invalidateQueries({ queryKey: ["leadership-operational-detail", tenantId] });
      qc.invalidateQueries({ queryKey: queryKeys.supporters(tenantId) });
      void qc.invalidateQueries({ queryKey: queryKeys.supporterPoliticalSummaries(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(tenantId) });
      toast.success("Liderança excluída — apoiadores desvinculados");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
