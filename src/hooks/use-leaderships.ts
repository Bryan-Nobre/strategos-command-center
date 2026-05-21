import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as leadershipsService from "@/services/leaderships";
import type { TablesInsert } from "@/types/supabase";

export function useLeaderships(tenantId: string) {
  return useQuery({
    queryKey: ["leaderships", tenantId],
    queryFn: () => leadershipsService.listLeaderships(tenantId),
    enabled: !!tenantId,
  });
}

export function useCreateLeadership(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TablesInsert<"leaderships">, "tenant_id">) =>
      leadershipsService.createLeadership(tenantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaderships", tenantId] });
      qc.invalidateQueries({ queryKey: ["dashboard", tenantId] });
      toast.success("Liderança cadastrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
