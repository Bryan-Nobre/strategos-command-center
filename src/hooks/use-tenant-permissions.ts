import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchMyTenantPermissions } from "@/services/tenant-roles";
import {
  canAccessModule,
  canPerform,
  canWriteModule,
  ROUTE_MODULE_MAP,
  type PermissionModule,
  type TenantPermissionsMap,
} from "@/types/permissions";

export function useTenantPermissions(tenantId: string) {
  const query = useQuery({
    queryKey: queryKeys.tenantPermissions(tenantId),
    queryFn: () => fetchMyTenantPermissions(tenantId),
    enabled: !!tenantId,
    staleTime: 60_000,
  });

  const permissions = query.data ?? null;

  return useMemo(() => {
    const can = (module: PermissionModule, action: string) =>
      canPerform(permissions, module, action);

    const canReadRoute = (pathname: string) => {
      const module = ROUTE_MODULE_MAP[pathname];
      if (!module) return true;
      return canAccessModule(permissions, module);
    };

    return {
      permissions,
      roleName: permissions?.role_name ?? null,
      isFullAccess: permissions?.is_full_access === true,
      isLoading: query.isLoading,
      isError: query.isError,
      can,
      canRead: (module: PermissionModule) => canAccessModule(permissions, module),
      canWrite: (module: PermissionModule) => canWriteModule(permissions, module),
      canReadRoute,
      refetch: query.refetch,
    };
  }, [permissions, query.isLoading, query.isError, query.refetch]);
}

export type TenantPermissionsGate = ReturnType<typeof useTenantPermissions>;

export function hasRouteAccess(
  permissions: TenantPermissionsMap | null | undefined,
  pathname: string,
): boolean {
  const module = ROUTE_MODULE_MAP[pathname];
  if (!module) return true;
  return canAccessModule(permissions, module);
}
