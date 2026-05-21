import { createContext, useContext, type ReactNode } from "react";
import type { Tenant } from "@/lib/supabase/session";
import { setStoredTenantId } from "@/lib/supabase/session";

type TenantContextValue = {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  setActiveTenant: (tenant: Tenant) => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  children,
  tenants,
  activeTenant,
  onTenantChange,
}: {
  children: ReactNode;
  tenants: Tenant[];
  activeTenant: Tenant | null;
  onTenantChange?: (tenant: Tenant) => void;
}) {
  const setActiveTenant = (tenant: Tenant) => {
    setStoredTenantId(tenant.id);
    onTenantChange?.(tenant);
    window.location.reload();
  };

  return (
    <TenantContext.Provider value={{ tenants, activeTenant, setActiveTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenantContext deve ser usado dentro de TenantProvider");
  return ctx;
}
