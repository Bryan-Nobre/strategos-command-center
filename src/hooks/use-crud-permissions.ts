import { useTenantPermissions } from "@/hooks/use-tenant-permissions";
import { useTenant } from "@/hooks/use-tenant";
import type { PermissionModule } from "@/types/permissions";

/** Atalho para gates de CRUD por módulo de dados. Segurança real: RLS no PostgreSQL. */
export function useCrudPermissions(module: PermissionModule) {
  const { tenantId } = useTenant();
  const perms = useTenantPermissions(tenantId);

  return {
    ...perms,
    canRead: perms.canRead(module),
    canCreate: perms.can(module, "create"),
    canUpdate: perms.can(module, "update"),
    canDelete: perms.can(module, "delete"),
    canImport: perms.can(module, "import"),
    canExport: perms.can(module, "export") || perms.can("reports", "export"),
    canInvite: perms.can(module, "invite"),
    canManageRoles: perms.can(module, "manage_roles"),
    canEditProfile: perms.can("settings", "profile"),
    canEditLanding: perms.can("settings", "landing"),
    canEditGoals: perms.can("settings", "goals"),
    canEditNotifications: perms.can("settings", "notifications"),
  };
}
