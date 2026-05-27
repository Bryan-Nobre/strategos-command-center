import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PlanLimitNotice } from "@/components/common/PlanLimitNotice";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useTeamMembers } from "@/hooks/use-team";
import { useTenant } from "@/hooks/use-tenant";
import { usePlanGate } from "@/hooks/use-plan-gate";
import { useTenantPermissions } from "@/hooks/use-tenant-permissions";
import { queryKeys } from "@/lib/query-keys";
import { planLimitUserMessage } from "@/lib/plan-errors";
import { createInvitation, listInvitations, updateMemberRole } from "@/services/team";
import { listTenantRoles } from "@/services/tenant-roles";
import { parseEquipeSearch, serializeEquipeSearch } from "@/lib/list-search/equipe";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import { ListUrlActions } from "@/components/common/ListUrlActions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/equipe/")({
  validateSearch: (search: Record<string, unknown>) => parseEquipeSearch(search),
  component: EquipeMembrosPage,
});

function EquipeMembrosPage() {
  const { tenantId } = useTenant();
  const urlSearch = Route.useSearch();
  const { localText: busca, setLocalText: setBusca, setSearch } = useSyncedListSearch({
    search: urlSearch,
    serialize: serializeEquipeSearch,
  });

  const planGate = usePlanGate(tenantId);
  const perms = useTenantPermissions(tenantId);
  const qc = useQueryClient();

  const { data: team, isLoading: teamLoading } = useTeamMembers(tenantId);
  const { data: roles } = useQuery({
    queryKey: queryKeys.tenantRoles(tenantId),
    queryFn: () => listTenantRoles(tenantId),
    enabled: !!tenantId,
  });

  const { data: invitations } = useQuery({
    queryKey: queryKeys.invitations(tenantId),
    queryFn: () => listInvitations(tenantId),
    enabled: !!tenantId,
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState<string>("");

  const inviteMutation = useMutation({
    mutationFn: () => {
      const role = roles?.find((r) => r.id === inviteRoleId);
      if (!role) throw new Error("Selecione um cargo");
      return createInvitation(tenantId, inviteEmail, role.id, role.name);
    },
    onSuccess: (data) => {
      toast.success(`Convite criado. Link: /invite/${data.token}`);
      qc.invalidateQueries({ queryKey: queryKeys.invitations(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.planUsage(tenantId) });
      setInviteEmail("");
    },
    onError: (e: Error) => toast.error(planLimitUserMessage(e)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      updateMemberRole(memberId, roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.team(tenantId) });
      toast.success("Cargo do membro atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignableRoles = (roles ?? []).filter((r) => !r.isFullAccess);

  useEffect(() => {
    if (!inviteRoleId && assignableRoles.length > 0) {
      setInviteRoleId(assignableRoles[0].id);
    }
  }, [assignableRoles, inviteRoleId]);

  const q = busca.toLowerCase();
  const filteredTeam = useMemo(() => {
    if (!q) return team ?? [];
    return (team ?? []).filter((m) =>
      [m.profiles.full_name, m.customRoleName, m.role].some((f) =>
        f?.toLowerCase().includes(q),
      ),
    );
  }, [team, q]);

  const filteredInvitations = useMemo(() => {
    if (!q) return invitations ?? [];
    return (invitations ?? []).filter((inv) =>
      [inv.email, inv.customRoleName, inv.role].some((f) => f?.toLowerCase().includes(q)),
    );
  }, [invitations, q]);

  function clearFilters() {
    setBusca("");
    setSearch({});
  }

  if (teamLoading) return <LoadingState />;

  return (
    <>
      {!planGate.canInviteTeam() && (
        <PlanLimitNotice message="Limite de vagas na equipe atingido (membros ativos + convites pendentes)." />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Membros ativos</CardTitle>
            <CardDescription>Usuários com acesso à campanha</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{team?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{invitations?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Membros e convites</CardTitle>
          <CardDescription>
            Atribua cargos customizados. Permissões detalhadas em{" "}
            <Link to="/equipe/cargos" className="text-primary underline-offset-4 hover:underline">
              Cargos
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar membro ou convite..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            {busca.trim() && <ListUrlActions onClear={clearFilters} />}
          </div>

          <PermissionGate module="team" action="invite">
            <div className="grid gap-2 rounded-lg border bg-muted/30 p-4 md:grid-cols-12">
              <Input
                placeholder="e-mail"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="md:col-span-5"
              />
              <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                <SelectTrigger className="md:col-span-4">
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="md:col-span-3"
                size="sm"
                onClick={() => inviteMutation.mutate()}
                disabled={
                  inviteMutation.isPending ||
                  !inviteEmail.trim() ||
                  !inviteRoleId ||
                  !planGate.canInviteTeam()
                }
              >
                Convidar
              </Button>
            </div>
          </PermissionGate>

          <Separator />

          {(filteredTeam ?? []).map((m) => (
            <div key={m.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">{m.profiles.full_name ?? "Membro"}</div>
                <div className="text-xs text-muted-foreground">
                  {m.customRoleName ?? m.role}
                </div>
              </div>
              {m.role === "owner" ? (
                <Badge>Administrador</Badge>
              ) : perms.can("team", "manage_roles") ? (
                <Select
                  value={m.customRoleId ?? ""}
                  onValueChange={(v) => roleMutation.mutate({ memberId: m.id, roleId: v })}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary">{m.customRoleName ?? m.role}</Badge>
              )}
            </div>
          ))}

          {(filteredInvitations ?? []).map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
            >
              <span>
                {inv.email} · {inv.customRoleName ?? inv.role} (pendente)
              </span>
              <Link
                to="/invite/$token"
                params={{ token: inv.token }}
                className="text-xs text-primary"
              >
                Link convite
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
