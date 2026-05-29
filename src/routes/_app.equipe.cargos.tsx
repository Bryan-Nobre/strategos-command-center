import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/common/LoadingState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { RolePermissionEditor } from "@/components/team/RolePermissionEditor";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTenant } from "@/hooks/use-tenant";
import { useTeamMembersEnriched } from "@/hooks/use-team-members";
import { queryKeys } from "@/lib/query-keys";
import { deleteTenantRole, listTenantRoles, upsertTenantRole } from "@/services/tenant-roles";
import type { TenantRoleRow } from "@/types/permissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/equipe/cargos")({
  component: EquipeCargosPage,
});

function canDeleteRole(role: TenantRoleRow, activeMemberCount: number) {
  return !role.isSystem && !role.isFullAccess && activeMemberCount === 0;
}

function EquipeCargosPage() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<TenantRoleRow | null>(null);

  const { data: roles, isLoading } = useQuery({
    queryKey: queryKeys.tenantRoles(tenantId),
    queryFn: () => listTenantRoles(tenantId),
    enabled: !!tenantId,
  });

  const { data: teamMembers } = useTeamMembersEnriched(tenantId);

  const roleMemberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of teamMembers ?? []) {
      if (m.status !== "active" || !m.customRoleId) continue;
      counts.set(m.customRoleId, (counts.get(m.customRoleId) ?? 0) + 1);
    }
    return counts;
  }, [teamMembers]);

  const selectedRole = useMemo(() => {
    if (selectedId === "new") return null;
    if (!selectedId) return roles?.[0] ?? null;
    return roles?.find((r) => r.id === selectedId) ?? null;
  }, [roles, selectedId]);

  const saveMutation = useMutation({
    mutationFn: (payload: {
      roleId?: string | null;
      name: string;
      description?: string;
      permissions: TenantRoleRow["permissions"];
    }) => upsertTenantRole(tenantId, payload),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.tenantRoles(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.tenantPermissions(tenantId) });
      setSelectedId(row.id);
      toast.success("Cargo salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => deleteTenantRole(roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tenantRoles(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.planUsage(tenantId) });
      setSelectedId(null);
      setRoleToDelete(null);
      toast.success("Cargo excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleDeleteRole(role: TenantRoleRow) {
    const count = roleMemberCounts.get(role.id) ?? role.memberCount;
    if (count > 0) {
      toast.error("Remova ou altere o cargo dos membros antes de excluir.");
      return;
    }
    setRoleToDelete(role);
  }

  if (isLoading) return <LoadingState />;

  const isNew = selectedId === "new";

  return (
    <PermissionGate module="team" action="manage_roles">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="shadow-elegant h-fit">
          <CardContent className="space-y-2 p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedId("new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo cargo
            </Button>
            {(roles ?? []).map((role) => {
              const activeCount = roleMemberCounts.get(role.id) ?? 0;
              const selected =
                selectedId === role.id || (!selectedId && roles?.[0]?.id === role.id);
              const deletable = canDeleteRole(role, activeCount);

              return (
                <div key={role.id} className="flex items-center gap-0.5">
                  <Button
                    variant={selected ? "secondary" : "ghost"}
                    size="sm"
                    className="min-w-0 flex-1 justify-between"
                    onClick={() => setSelectedId(role.id)}
                  >
                    <span className="truncate">{role.name}</span>
                    <span className="ml-1 shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      {role.isFullAccess ? "total" : `${activeCount}`}
                    </span>
                  </Button>
                  {deletable && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive",
                        selected && "text-destructive/80",
                      )}
                      title="Excluir cargo"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDeleteRole(role)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <RolePermissionEditor
          key={isNew ? "new" : selectedRole?.id}
          role={isNew ? null : selectedRole}
          isNew={isNew}
          saving={saveMutation.isPending}
          onSave={(form) =>
            saveMutation.mutate({
              roleId: isNew ? null : selectedRole?.id,
              name: form.name,
              description: form.description,
              permissions: form.permissions,
            })
          }
          onDelete={
            selectedRole && canDeleteRole(selectedRole, roleMemberCounts.get(selectedRole.id) ?? 0)
              ? () => deleteMutation.mutate(selectedRole.id)
              : undefined
          }
        />
      </div>

      <ConfirmDeleteDialog
        open={roleToDelete !== null}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
        title="Excluir cargo?"
        description={
          roleToDelete
            ? `O cargo "${roleToDelete.name}" será removido permanentemente. Esta ação não pode ser desfeita.`
            : ""
        }
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!roleToDelete) return;
          deleteMutation.mutate(roleToDelete.id);
        }}
      />
    </PermissionGate>
  );
}
