import { createContext, useContext, type ReactNode } from "react";
import type { Enums } from "@/types/supabase";
import type { Tenant } from "@/lib/supabase/session";
import { setStoredTenantId } from "@/lib/supabase/session";
import { getPlanLimits, type PlanLimits } from "@/types/tenant";
import { clearTenantScopedCache } from "@/lib/query-cache";
import { getQueryClient } from "@/lib/query-client";

type TenantContextValue = {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  membershipRole: Enums<"tenant_role"> | null;
  planLimits: PlanLimits | null;
  setActiveTenant: (tenant: Tenant) => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  children,
  tenants,
  activeTenant,
  membershipRole,
  onTenantChange,
}: {
  children: ReactNode;
  tenants: Tenant[];
  activeTenant: Tenant | null;
  membershipRole: Enums<"tenant_role"> | null;
  onTenantChange?: (tenant: Tenant) => void;
}) {
  const setActiveTenant = (tenant: Tenant) => {
    if (tenant.id === activeTenant?.id) return;
    setStoredTenantId(tenant.id);
    clearTenantScopedCache(getQueryClient());
    onTenantChange?.(tenant);
    window.location.reload();
  };

  const planLimits = activeTenant ? getPlanLimits(activeTenant.plan) : null;

  return (
    <TenantContext.Provider
      value={{ tenants, activeTenant, membershipRole, planLimits, setActiveTenant }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenantContext deve ser usado dentro de TenantProvider");
  return ctx;
}
