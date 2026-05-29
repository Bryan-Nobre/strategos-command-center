import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendaEventCard } from "@/components/agenda/AgendaEventCard";
import type { AgendaEventWithRelations } from "@/services/agenda";
import { parseIsoDate, weekDatesFromStart } from "@/lib/agenda-utils";

export function AgendaWeekView({
  weekStartIso,
  events,
  highlightId,
  canUpdate,
  canDelete,
  onOpen,
  onEdit,
  onDelete,
}: {
  weekStartIso: string;
  events: AgendaEventWithRelations[];
  highlightId?: string;
  canUpdate: boolean;
  canDelete: boolean;
  onOpen: (e: AgendaEventWithRelations) => void;
  onEdit: (e: AgendaEventWithRelations) => void;
  onDelete: (e: AgendaEventWithRelations) => void;
}) {
  const days = weekDatesFromStart(weekStartIso);

  return (
    <div className="agenda-week-grid space-y-4">
      {days.map((iso) => {
        const dayEvents = events.filter((e) => e.event_date === iso);
        const label = format(parseIsoDate(iso), "EEE, d MMM", { locale: ptBR });
        return (
          <section key={iso} className="agenda-week-day">
            <h3 className="agenda-week-day-title capitalize">{label}</h3>
            {dayEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Sem eventos</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((ev) => (
                  <AgendaEventCard
                    key={ev.id}
                    event={ev}
                    highlight={ev.id === highlightId}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onOpen={() => onOpen(ev)}
                    onEdit={() => onEdit(ev)}
                    onDelete={() => onDelete(ev)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
