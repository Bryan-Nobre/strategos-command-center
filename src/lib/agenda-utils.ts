import type { AgendaEventWithRelations } from "@/services/agenda";

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function startOfWeekMonday(iso: string): string {
  const d = parseIsoDate(iso);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toIsoDate(d);
}

export function addDaysIso(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function weekDatesFromStart(weekStartIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysIso(weekStartIso, i));
}

export function attendeeCounts(event: AgendaEventWithRelations) {
  const attendees = event.agenda_event_attendees ?? [];
  const total = attendees.length;
  const confirmed = attendees.filter(
    (a) => a.status === "confirmado" || a.status === "compareceu",
  ).length;
  return { total, confirmed };
}

export function computeAgendaStats(events: AgendaEventWithRelations[], todayIso: string) {
  const today = parseIsoDate(todayIso);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndIso = toIsoDate(weekEnd);
  const next7End = new Date(today);
  next7End.setDate(next7End.getDate() + 7);
  const next7EndIso = toIsoDate(next7End);

  const active = events.filter((e) => e.status !== "cancelado");

  return {
    hoje: active.filter((e) => e.event_date === todayIso).length,
    semana: active.filter((e) => e.event_date >= todayIso && e.event_date <= weekEndIso).length,
    proximos7: active.filter((e) => e.event_date >= todayIso && e.event_date <= next7EndIso).length,
    comApoiadores: active.filter((e) => (e.agenda_event_attendees?.length ?? 0) > 0).length,
    total: events.length,
  };
}

export function datesWithEvents(events: AgendaEventWithRelations[]): Date[] {
  const set = new Set(events.filter((e) => e.status !== "cancelado").map((e) => e.event_date));
  return [...set].map((iso) => parseIsoDate(iso));
}

export function sortEventsByTime(events: AgendaEventWithRelations[]) {
  return [...events].sort((a, b) => {
    if (a.event_date !== b.event_date) return a.event_date.localeCompare(b.event_date);
    const ta = a.event_time ?? "99:99";
    const tb = b.event_time ?? "99:99";
    return ta.localeCompare(tb);
  });
}
