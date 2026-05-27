import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import * as agendaService from "@/services/agenda";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export function useAgendaEvents(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.agenda(tenantId),
    queryFn: () => agendaService.listAgendaEvents(tenantId),
    enabled: !!tenantId,
  });
}

export function useCreateAgendaEvent(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TablesInsert<"agenda_events">, "tenant_id">) =>
      agendaService.createAgendaEvent(tenantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agenda(tenantId) });
      toast.success("Evento agendado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAgendaEvent(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: TablesUpdate<"agenda_events"> & { id: string }) =>
      agendaService.updateAgendaEvent(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agenda(tenantId) });
      toast.success("Evento atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAgendaEvent(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agendaService.deleteAgendaEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agenda(tenantId) });
      toast.success("Evento excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
