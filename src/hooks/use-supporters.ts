import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
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
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.leaderships(tenantId) });
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
    mutationFn: (rows: supportersService.SupporterImportRow[]) =>
      supportersService.importSupporters(tenantId, rows),
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: queryKeys.supporters(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(tenantId) });
      toast.success(`${count} apoiador(es) importado(s)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
