import { canAccessModule, ROUTE_MODULE_MAP, type PermissionModule, type TenantPermissionsMap } from "@/types/permissions";

/** Verifica se o usuário pode acessar a rota de destino (somente UX — RLS no backend). */
export function canAccessDashboardRoute(
  permissions: TenantPermissionsMap | null | undefined,
  path: string,
): boolean {
  const module = ROUTE_MODULE_MAP[path] as PermissionModule | undefined;
  if (!module) return true;
  return canAccessModule(permissions, module);
}
