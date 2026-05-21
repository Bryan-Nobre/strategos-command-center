import { createClient } from "@/lib/supabase/client";

export type DashboardMetrics = {
  total_supporters: number;
  strong_support: number;
  undecided: number;
  leaderships: number;
  open_demands: number;
  funnel: Record<string, number> | null;
};

export async function getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_tenant_dashboard_metrics", {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return data as DashboardMetrics;
}

export async function listActivities(tenantId: string, limit = 10) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("id, message, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function listPollSnapshots(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("poll_snapshots")
    .select("id, snapshot_type, title, data, recorded_at")
    .eq("tenant_id", tenantId);
  if (error) throw error;
  return data;
}

export async function updatePollSnapshot(id: string, data: unknown) {
  const supabase = createClient();
  const { error } = await supabase.from("poll_snapshots").update({ data }).eq("id", id);
  if (error) throw error;
}
