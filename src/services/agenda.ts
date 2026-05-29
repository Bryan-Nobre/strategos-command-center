import { createClient } from "@/lib/supabase/client";
import type { Enums, TablesInsert, TablesUpdate } from "@/types/supabase";

const EVENT_SELECT = `
  id,
  title,
  event_date,
  event_time,
  location,
  neighborhood,
  city,
  event_type,
  status,
  description,
  leadership_id,
  expected_attendance,
  created_at,
  updated_at,
  leaderships ( id, name ),
  agenda_event_attendees (
    id,
    role,
    status,
    notes,
    supporter_id,
    supporters ( id, name, phone, neighborhood )
  )
`;

export type AgendaAttendeeNested = {
  id: string;
  role: Enums<"agenda_attendee_role">;
  status: Enums<"agenda_attendee_status">;
  notes: string | null;
  supporter_id: string;
  supporters: {
    id: string;
    name: string;
    phone: string | null;
    neighborhood: string | null;
  } | null;
};

export type AgendaEventWithRelations = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  neighborhood: string | null;
  city: string | null;
  event_type: Enums<"agenda_event_type">;
  status: Enums<"agenda_event_status">;
  description: string | null;
  leadership_id: string | null;
  expected_attendance: number | null;
  created_at: string;
  updated_at: string;
  leaderships: { id: string; name: string } | null;
  agenda_event_attendees: AgendaAttendeeNested[];
};

export async function listAgendaEvents(tenantId: string): Promise<AgendaEventWithRelations[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agenda_events")
    .select(EVENT_SELECT)
    .eq("tenant_id", tenantId)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as AgendaEventWithRelations[];
}

export async function createAgendaEvent(
  tenantId: string,
  payload: Omit<TablesInsert<"agenda_events">, "tenant_id">,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("agenda_events")
    .insert({ ...payload, tenant_id: tenantId, created_by: user?.id ?? null })
    .select(EVENT_SELECT)
    .single();
  if (error) throw error;
  return data as AgendaEventWithRelations;
}

export async function updateAgendaEvent(id: string, payload: TablesUpdate<"agenda_events">) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agenda_events")
    .update(payload)
    .eq("id", id)
    .select(EVENT_SELECT)
    .single();
  if (error) throw error;
  return data as AgendaEventWithRelations;
}

export async function deleteAgendaEvent(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("agenda_events").delete().eq("id", id);
  if (error) throw error;
}
