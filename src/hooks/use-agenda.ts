import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import * as agendaService from "@/services/agenda";
import * as attendeeService from "@/services/agenda-attendees";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";
import type { AgendaAttendeePayload } from "@/services/agenda-attendees";

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

export function useAddAgendaAttendee(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AgendaAttendeePayload) =>
      attendeeService.addAgendaAttendee(tenantId, {
        event_id: payload.event_id,
        supporter_id: payload.supporter_id,
        role: payload.role ?? "acompanhante",
        status: payload.status ?? "convidado",
        notes: payload.notes ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agenda(tenantId) });
      toast.success("Apoiador adicionado ao evento");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAgendaAttendee(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: TablesUpdate<"agenda_event_attendees"> & { id: string }) =>
      attendeeService.updateAgendaAttendee(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agenda(tenantId) });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveAgendaAttendee(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendeeService.removeAgendaAttendee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agenda(tenantId) });
      toast.success("Apoiador removido do evento");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
