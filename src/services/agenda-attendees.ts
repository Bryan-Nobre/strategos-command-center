import { createClient } from "@/lib/supabase/client";
import type { Enums, TablesInsert, TablesUpdate } from "@/types/supabase";

export async function addAgendaAttendee(
  tenantId: string,
  payload: Omit<TablesInsert<"agenda_event_attendees">, "tenant_id">,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agenda_event_attendees")
    .insert({ ...payload, tenant_id: tenantId })
    .select("id, role, status, notes, supporter_id, supporters ( id, name, phone, neighborhood )")
    .single();
  if (error) throw error;
  return data;
}

export async function updateAgendaAttendee(id: string, payload: TablesUpdate<"agenda_event_attendees">) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agenda_event_attendees")
    .update(payload)
    .eq("id", id)
    .select("id, role, status, notes, supporter_id, supporters ( id, name, phone, neighborhood )")
    .single();
  if (error) throw error;
  return data;
}

export async function removeAgendaAttendee(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("agenda_event_attendees").delete().eq("id", id);
  if (error) throw error;
}

export type AgendaAttendeePayload = {
  event_id: string;
  supporter_id: string;
  role?: Enums<"agenda_attendee_role">;
  status?: Enums<"agenda_attendee_status">;
  notes?: string | null;
};
