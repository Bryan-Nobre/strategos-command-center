import { useRouteContext } from "@tanstack/react-router";

export function useTenant() {
  const { activeTenant, profile, tenants } = useRouteContext({ from: "/_app" });
  return { tenantId: activeTenant?.id ?? "", activeTenant, profile, tenants };
}
