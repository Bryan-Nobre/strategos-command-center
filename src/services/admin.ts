import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/supabase";

export async function listAllTenants() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name, plan, status, created_at, owner_user_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateTenant(
  id: string,
  payload: { status?: Enums<"tenant_status">; plan?: Enums<"tenant_plan">; name?: string },
) {
  const supabase = createClient();
  const { data, error } = await supabase.from("tenants").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function getPlatformMetrics() {
  const supabase = createClient();
  const [tenants, supporters, demands] = await Promise.all([
    supabase.from("tenants").select("id", { count: "exact", head: true }),
    supabase.from("supporters").select("id", { count: "exact", head: true }),
    supabase.from("demands").select("id", { count: "exact", head: true }),
  ]);
  const activeTenants = await supabase
    .from("tenants")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  return {
    totalTenants: tenants.count ?? 0,
    activeTenants: activeTenants.count ?? 0,
    totalSupporters: supporters.count ?? 0,
    totalDemands: demands.count ?? 0,
  };
}
