import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/common/LoadingState";
import { RolePermissionEditor } from "@/components/team/RolePermissionEditor";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTenant } from "@/hooks/use-tenant";
import { queryKeys } from "@/lib/query-keys";
import { deleteTenantRole, listTenantRoles, upsertTenantRole } from "@/services/tenant-roles";
import type { TenantRoleRow } from "@/types/permissions";

export const Route = createFileRoute("/_app/equipe/cargos")({
  component: EquipeCargosPage,
});

function EquipeCargosPage() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);

  const { data: roles, isLoading } = useQuery({
    queryKey: queryKeys.tenantRoles(tenantId),
    queryFn: () => listTenantRoles(tenantId),
    enabled: !!tenantId,
  });

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
      setSelectedId(null);
      toast.success("Cargo excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingState />;

  const isNew = selectedId === "new";

  return (
    <PermissionGate module="team" action="manage_roles">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
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
            {(roles ?? []).map((role) => (
              <Button
                key={role.id}
                variant={
                  (selectedId === role.id || (!selectedId && roles?.[0]?.id === role.id))
                    ? "secondary"
                    : "ghost"
                }
                size="sm"
                className="w-full justify-between"
                onClick={() => setSelectedId(role.id)}
              >
                <span className="truncate">{role.name}</span>
                {role.isFullAccess && (
                  <span className="ml-1 text-[10px] uppercase text-muted-foreground">total</span>
                )}
              </Button>
            ))}
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
            selectedRole && !selectedRole.isSystem
              ? () => deleteMutation.mutate(selectedRole.id)
              : undefined
          }
        />
      </div>
    </PermissionGate>
  );
}
