import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as supportersService from "@/services/supporters";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export function useSupporters(tenantId: string) {
  return useQuery({
    queryKey: ["supporters", tenantId],
    queryFn: () => supportersService.listSupporters(tenantId),
    enabled: !!tenantId,
  });
}

export function useCreateSupporter(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TablesInsert<"supporters">, "tenant_id">) =>
      supportersService.createSupporter(tenantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supporters", tenantId] });
      qc.invalidateQueries({ queryKey: ["dashboard", tenantId] });
      toast.success("Apoiador cadastrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSupporter(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: TablesUpdate<"supporters"> & { id: string }) =>
      supportersService.updateSupporter(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supporters", tenantId] });
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
      qc.invalidateQueries({ queryKey: ["supporters", tenantId] });
      toast.success("Apoiador removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
