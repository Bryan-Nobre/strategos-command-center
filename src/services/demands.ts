import { createClient } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export async function listDemands(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("demands")
    .select("id, title, category, status, priority, neighborhood, description, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDemand(tenantId: string, payload: TablesInsert<"demands">) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("demands")
    .insert({ ...payload, tenant_id: tenantId, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  await supabase.rpc("log_activity", {
    p_tenant_id: tenantId,
    p_message: `Demanda aberta: ${payload.title}`,
    p_entity_type: "demand",
    p_entity_id: data.id,
  });
  return data;
}

export async function updateDemand(id: string, payload: TablesUpdate<"demands">) {
  const supabase = createClient();
  const { data, error } = await supabase.from("demands").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDemand(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("demands").delete().eq("id", id);
  if (error) throw error;
}
