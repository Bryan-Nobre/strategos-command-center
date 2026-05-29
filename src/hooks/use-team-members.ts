import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { planLimitUserMessage } from "@/lib/plan-errors";
import {
  listTeamMembersEnriched,
  provisionTeamMember,
  removeTeamMember,
  resetTeamMemberPassword,
  setTeamMemberStatus,
  updateTeamMemberDetails,
  type TeamMemberEnriched,
} from "@/services/team-provision";

export function useTeamMembersEnriched(tenantId: string) {
  return useQuery({
    queryKey: [...queryKeys.team(tenantId), "enriched"],
    queryFn: () => listTeamMembersEnriched(tenantId),
    enabled: !!tenantId,
  });
}

export function useProvisionTeamMember(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: provisionTeamMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.team(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.planUsage(tenantId) });
      toast.success("Acesso criado. O membro já pode entrar com e-mail e senha.");
    },
    onError: (e: Error) => toast.error(planLimitUserMessage(e)),
  });
}

export function useUpdateTeamMember(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      ...payload
    }: {
      memberId: string;
      fullName?: string;
      phone?: string;
      customRoleId?: string;
    }) => updateTeamMemberDetails(memberId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.team(tenantId) });
      toast.success("Membro atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetTeamMemberStatus(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: "active" | "suspended" }) =>
      setTeamMemberStatus(memberId, status),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: queryKeys.team(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.planUsage(tenantId) });
      toast.success(status === "suspended" ? "Acesso bloqueado" : "Acesso reativado");
    },
    onError: (e: Error) => toast.error(planLimitUserMessage(e)),
  });
}

export function useResetTeamMemberPassword(tenantId: string) {
  return useMutation({
    mutationFn: ({ memberId, password }: { memberId: string; password: string }) =>
      resetTeamMemberPassword(memberId, password),
    onSuccess: () => toast.success("Senha redefinida"),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveTeamMember(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeTeamMember(memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.team(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.planUsage(tenantId) });
      toast.success("Membro removido da campanha");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export type { TeamMemberEnriched };
