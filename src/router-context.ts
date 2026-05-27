import type { Profile, Tenant } from "@/lib/supabase/session";
import type { Enums } from "@/types/supabase";

/** Apenas dados serializáveis — necessário para dehydrate/hydrate do TanStack Router (SSR). */
export type RouterContext = {
  profile: Profile | null;
  tenants: Tenant[];
  activeTenant: Tenant | null;
  membershipRole: Enums<"tenant_role"> | null;
};
