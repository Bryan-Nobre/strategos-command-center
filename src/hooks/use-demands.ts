import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as demandsService from "@/services/demands";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export function useDemands(tenantId: string) {
  return useQuery({
    queryKey: ["demands", tenantId],
    queryFn: () => demandsService.listDemands(tenantId),
    enabled: !!tenantId,
  });
}

export function useCreateDemand(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TablesInsert<"demands">, "tenant_id">) =>
      demandsService.createDemand(tenantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demands", tenantId] });
      qc.invalidateQueries({ queryKey: ["dashboard", tenantId] });
      toast.success("Demanda criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDemand(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: TablesUpdate<"demands"> & { id: string }) =>
      demandsService.updateDemand(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demands", tenantId] });
      toast.success("Demanda atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
