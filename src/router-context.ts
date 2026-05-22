import type { Profile, Tenant } from "@/lib/supabase/session";

/** Apenas dados serializáveis — necessário para dehydrate/hydrate do TanStack Router (SSR). */
export type RouterContext = {
  profile: Profile | null;
  tenants: Tenant[];
  activeTenant: Tenant | null;
};
