import type { QueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile, Tenant } from "@/lib/supabase/session";

export type RouterContext = {
  queryClient: QueryClient;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tenants: Tenant[];
  activeTenant: Tenant | null;
};
