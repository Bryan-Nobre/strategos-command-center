import { createClient } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export async function listSupporters(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supporters")
    .select("id, name, phone, neighborhood, city, electoral_zone, electoral_section, status, support_level, notes, tags, leadership_id, source, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSupporter(tenantId: string, payload: TablesInsert<"supporters">) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("supporters")
    .insert({ ...payload, tenant_id: tenantId, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  await supabase.rpc("log_activity", {
    p_tenant_id: tenantId,
    p_message: `Novo apoiador: ${payload.name}`,
    p_entity_type: "supporter",
    p_entity_id: data.id,
  });
  return data;
}

export async function updateSupporter(id: string, payload: TablesUpdate<"supporters">) {
  const supabase = createClient();
  const { data, error } = await supabase.from("supporters").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSupporter(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("supporters").delete().eq("id", id);
  if (error) throw error;
}
