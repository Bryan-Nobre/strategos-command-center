import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus, Search, UserPlus } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { PlanLimitNotice } from "@/components/common/PlanLimitNotice";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { TeamCompactBar } from "@/components/team/TeamCompactBar";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { TeamMemberFormSheet } from "@/components/team/TeamMemberFormSheet";
import { ResetPasswordDialog } from "@/components/team/ResetPasswordDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useProvisionTeamMember,
  useRemoveTeamMember,
  useResetTeamMemberPassword,
  useSetTeamMemberStatus,
  useTeamMembersEnriched,
  useUpdateTeamMember,
  type TeamMemberEnriched,
} from "@/hooks/use-team-members";
import { useTenant } from "@/hooks/use-tenant";
import { usePlanGate } from "@/hooks/use-plan-gate";
import { useTenantPermissions } from "@/hooks/use-tenant-permissions";
import { queryKeys } from "@/lib/query-keys";
import { listTenantRoles } from "@/services/tenant-roles";
import { parseEquipeSearch, serializeEquipeSearch } from "@/lib/list-search/equipe";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import { ListUrlActions } from "@/components/common/ListUrlActions";

export const Route = createFileRoute("/_app/equipe/")({
  validateSearch: (search: Record<string, unknown>) => parseEquipeSearch(search),
  component: EquipeMembrosPage,
});

type SheetState =
  | { mode: "create" }
  | { mode: "edit"; member: TeamMemberEnriched }
  | null;

type ConfirmState =
  | { type: "block"; member: TeamMemberEnriched }
  | { type: "remove"; member: TeamMemberEnriched }
  | null;

function EquipeMembrosPage() {
  const { tenantId } = useTenant();
  const urlSearch = Route.useSearch();
  const { localText: busca, setLocalText: setBusca, setSearch } = useSyncedListSearch({
    search: urlSearch,
    serialize: serializeEquipeSearch,
  });

  const planGate = usePlanGate(tenantId);
  const perms = useTenantPermissions(tenantId);
  const canManage =
    perms.can("team", "invite") || perms.can("team", "manage_roles");
  const canCreate = perms.can("team", "invite");

  const { data: members, isLoading } = useTeamMembersEnriched(tenantId);
  const { data: roles } = useQuery({
    queryKey: queryKeys.tenantRoles(tenantId),
    queryFn: () => listTenantRoles(tenantId),
    enabled: !!tenantId,
  });

  const provisionMutation = useProvisionTeamMember(tenantId);
  const updateMutation = useUpdateTeamMember(tenantId);
  const statusMutation = useSetTeamMemberStatus(tenantId);
  const resetMutation = useResetTeamMemberPassword(tenantId);
  const removeMutation = useRemoveTeamMember(tenantId);

  const [sheet, setSheet] = useState<SheetState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [resetTarget, setResetTarget] = useState<TeamMemberEnriched | null>(null);

  const assignableRoles = useMemo(
    () => (roles ?? []).filter((r) => !r.isFullAccess).map((r) => ({ id: r.id, name: r.name })),
    [roles],
  );

  const stats = useMemo(() => {
    const list = members ?? [];
    const active = list.filter((m) => m.status === "active").length;
    const suspended = list.filter((m) => m.status === "suspended").length;
    return { active, suspended };
  }, [members]);

  const q = busca.toLowerCase().trim();
  const filtered = useMemo(() => {
    const list = members ?? [];
    if (!q) return list;
    return list.filter((m) =>
      [m.fullName, m.email, m.customRoleName, m.role, m.phone].some((f) =>
        f?.toLowerCase().includes(q),
      ),
    );
  }, [members, q]);

  function clearFilters() {
    setBusca("");
    setSearch({});
  }

  if (isLoading) return <LoadingState />;

  return (
    <>
      {!planGate.canInviteTeam() && (
        <PlanLimitNotice message="Limite de vagas na equipe do seu plano foi atingido. Remova ou bloqueie membros para liberar vagas." />
      )}

      <TeamCompactBar
        active={stats.active}
        suspended={stats.suspended}
        slotsLabel={planGate.teamUsageLabel()}
      />

      <Card className="shadow-elegant">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Membros com acesso</CardTitle>
            <CardDescription>
              Cadastre logins para sua equipe entrar na plataforma da campanha. Cargos e permissões
              em{" "}
              <Link to="/equipe/cargos" className="text-primary underline-offset-4 hover:underline">
                Cargos
              </Link>
              .
            </CardDescription>
          </div>
          <PermissionGate module="team" action="invite">
            <Button
              size="sm"
              className="shrink-0"
              disabled={!planGate.canInviteTeam()}
              onClick={() => setSheet({ mode: "create" })}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar membro
            </Button>
          </PermissionGate>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou cargo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            {busca.trim() && <ListUrlActions onClear={clearFilters} />}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <UsersEmptyIcon />
              <p className="mt-3 font-medium">
                {q ? "Nenhum membro encontrado" : "Nenhum membro além do administrador"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                {q
                  ? "Tente outro termo de busca."
                  : canCreate
                    ? "Adicione assessores e coordenadores com e-mail e senha de acesso."
                    : "Peça a um administrador para adicionar membros."}
              </p>
              {canCreate && !q && planGate.canInviteTeam() && (
                <Button className="mt-4" size="sm" onClick={() => setSheet({ mode: "create" })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Primeiro membro
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((m) => (
                <TeamMemberCard
                  key={m.id}
                  member={m}
                  canManage={canManage}
                  onEdit={() => setSheet({ mode: "edit", member: m })}
                  onBlock={() => setConfirm({ type: "block", member: m })}
                  onActivate={() =>
                    statusMutation.mutate({ memberId: m.id, status: "active" })
                  }
                  onResetPassword={() => setResetTarget(m)}
                  onRemove={() => setConfirm({ type: "remove", member: m })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TeamMemberFormSheet
        open={sheet !== null}
        onOpenChange={(open) => !open && setSheet(null)}
        mode={sheet?.mode === "edit" ? "edit" : "create"}
        member={sheet?.mode === "edit" ? sheet.member : null}
        roles={assignableRoles}
        loading={provisionMutation.isPending || updateMutation.isPending}
        onSubmitCreate={(values) => {
          provisionMutation.mutate(
            { tenantId, ...values },
            { onSuccess: () => setSheet(null) },
          );
        }}
        onSubmitEdit={(values) => {
          if (sheet?.mode !== "edit") return;
          updateMutation.mutate(
            { memberId: sheet.member.id, ...values },
            { onSuccess: () => setSheet(null) },
          );
        }}
      />

      <ResetPasswordDialog
        open={resetTarget !== null}
        onOpenChange={(open) => !open && setResetTarget(null)}
        memberName={resetTarget?.fullName ?? "Membro"}
        loading={resetMutation.isPending}
        onConfirm={(password) => {
          if (!resetTarget) return;
          resetMutation.mutate(
            { memberId: resetTarget.id, password },
            { onSuccess: () => setResetTarget(null) },
          );
        }}
      />

      <AlertDialog open={confirm?.type === "block"} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirm?.member.fullName}</strong> não poderá entrar na plataforma até ser
              reativado. A vaga do plano será liberada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={statusMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (confirm?.type !== "block") return;
                statusMutation.mutate(
                  { memberId: confirm.member.id, status: "suspended" },
                  { onSuccess: () => setConfirm(null) },
                );
              }}
            >
              {statusMutation.isPending ? "Bloqueando..." : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDeleteDialog
        open={confirm?.type === "remove"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Remover da campanha?"
        description={`${confirm?.member.fullName ?? "Este membro"} perderá o acesso a esta campanha. O login na plataforma permanece, mas sem vínculo com o mandato.`}
        loading={removeMutation.isPending}
        onConfirm={() => {
          if (confirm?.type !== "remove") return;
          removeMutation.mutate(confirm.member.id, { onSuccess: () => setConfirm(null) });
        }}
      />
    </>
  );
}

function UsersEmptyIcon() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <UserPlus className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}
