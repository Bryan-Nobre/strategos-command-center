import type { AgendaEventWithRelations } from "@/services/agenda";
import type { AgendaFilterState } from "@/lib/list-search/agenda";
import { addDaysIso, sortEventsByTime, weekDatesFromStart, startOfWeekMonday } from "@/lib/agenda-utils";

export function filterAgendaEvents(
  events: AgendaEventWithRelations[],
  filters: AgendaFilterState,
  query: string,
  highlightId?: string,
): AgendaEventWithRelations[] {
  if (highlightId) {
    const target = events.find((e) => e.id === highlightId);
    if (!target) return [];
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      [target.title, target.location, target.description, target.neighborhood].some((f) =>
        f?.toLowerCase().includes(q),
      );
    return matchQuery ? [target] : [];
  }

  let list = events;

  if (filters.tipo !== "all") {
    list = list.filter((e) => e.event_type === filters.tipo);
  }
  if (filters.status !== "all") {
    list = list.filter((e) => e.status === filters.status);
  }
  if (filters.filtro === "com_apoiadores") {
    list = list.filter((e) => (e.agenda_event_attendees?.length ?? 0) > 0);
  } else if (filters.filtro === "sem_apoiadores") {
    list = list.filter((e) => (e.agenda_event_attendees?.length ?? 0) === 0);
  }

  const q = query.toLowerCase();
  if (q) {
    list = list.filter((ev) =>
      [ev.title, ev.location, ev.description, ev.neighborhood, ev.city].some((f) =>
        f?.toLowerCase().includes(q),
      ),
    );
  }

  if (filters.view === "dia") {
    list = list.filter((ev) => ev.event_date === filters.data);
  } else if (filters.view === "semana") {
    const weekStart = startOfWeekMonday(filters.data);
    const weekDays = new Set(weekDatesFromStart(weekStart));
    list = list.filter((ev) => weekDays.has(ev.event_date));
  } else if (filters.view === "lista") {
    const from = filters.data;
    const to = addDaysIso(from, 30);
    list = list.filter((ev) => ev.event_date >= from && ev.event_date <= to);
  }

  return sortEventsByTime(list);
}
