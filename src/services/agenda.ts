import { createClient } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export async function listAgendaEvents(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agenda_events")
    .select("id, title, event_date, event_time, location, event_type, description")
    .eq("tenant_id", tenantId)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createAgendaEvent(tenantId: string, payload: TablesInsert<"agenda_events">) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("agenda_events")
    .insert({ ...payload, tenant_id: tenantId, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAgendaEvent(id: string, payload: TablesUpdate<"agenda_events">) {
  const supabase = createClient();
  const { data, error } = await supabase.from("agenda_events").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAgendaEvent(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("agenda_events").delete().eq("id", id);
  if (error) throw error;
}
