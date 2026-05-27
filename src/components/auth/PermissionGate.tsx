import { Navigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PermissionModule } from "@/types/permissions";
import { useTenantPermissions } from "@/hooks/use-tenant-permissions";
import { useTenant } from "@/hooks/use-tenant";

export function PermissionGate({
  module,
  action = "read",
  children,
  fallback,
}: {
  module: PermissionModule;
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { tenantId } = useTenant();
  const perms = useTenantPermissions(tenantId);

  if (perms.isLoading) return null;

  if (!perms.can(module, action)) {
    return (
      fallback ?? (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Sem permissão</AlertTitle>
          <AlertDescription>
            Seu cargo ({perms.roleName ?? "membro"}) não permite esta ação. Fale com o administrador
            da campanha.
          </AlertDescription>
        </Alert>
      )
    );
  }

  return <>{children}</>;
}

export function ModuleRouteGuard({
  module,
  children,
}: {
  module: PermissionModule;
  children: React.ReactNode;
}) {
  const { tenantId } = useTenant();
  const perms = useTenantPermissions(tenantId);

  if (perms.isLoading) return null;

  if (!perms.canRead(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
