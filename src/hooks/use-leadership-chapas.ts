import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import * as chapasService from "@/services/leadership-chapas";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export function useLeadershipChapas(tenantId: string, leadershipId: string | null) {
  return useQuery({
    queryKey: queryKeys.leadershipChapas(tenantId, leadershipId ?? ""),
    queryFn: () => chapasService.listChapasByLeadership(tenantId, leadershipId!),
    enabled: !!tenantId && !!leadershipId,
  });
}

export function useCreateLeadershipChapa(tenantId: string, leadershipId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TablesInsert<"leadership_chapas">, "tenant_id" | "leadership_id">) =>
      chapasService.createChapa(tenantId, { ...payload, leadership_id: leadershipId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.leadershipChapas(tenantId, leadershipId) });
      void qc.invalidateQueries({ queryKey: queryKeys.leaderships(tenantId) });
      toast.success("Chapa cadastrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLeadershipChapa(tenantId: string, leadershipId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: TablesUpdate<"leadership_chapas"> & { id: string }) =>
      chapasService.updateChapa(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.leadershipChapas(tenantId, leadershipId) });
      void qc.invalidateQueries({ queryKey: queryKeys.leaderships(tenantId) });
      toast.success("Chapa atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLeadershipChapa(tenantId: string, leadershipId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chapasService.deleteChapa(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.leadershipChapas(tenantId, leadershipId) });
      void qc.invalidateQueries({ queryKey: queryKeys.leaderships(tenantId) });
      toast.success("Chapa removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
