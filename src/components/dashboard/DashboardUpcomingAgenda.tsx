import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgendaEventWithRelations } from "@/services/agenda";
import { attendeeCounts, parseIsoDate, sortEventsByTime, toIsoDate } from "@/lib/agenda-utils";
import { AGENDA_EVENT_TYPE_LABELS } from "@/types/domain";

export function DashboardUpcomingAgenda({
  events,
  sectionIndex = 6,
}: {
  events: AgendaEventWithRelations[];
  sectionIndex?: number;
}) {
  const today = toIsoDate(new Date());
  const upcoming = sortEventsByTime(
    events.filter((e) => e.event_date >= today && e.status !== "cancelado"),
  ).slice(0, 3);

  if (!upcoming.length) return null;

  return (
    <section
      className="dashboard-section dashboard-section-agenda"
      style={{ "--section-index": sectionIndex } as CSSProperties}
    >
      <div className="dashboard-section-header">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <h2 className="dashboard-section-title">Próximos eventos</h2>
            <p className="text-xs text-muted-foreground">Compromissos de campo e reuniões</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
          <Link to="/agenda" search={{ data: today }}>
            Ver agenda
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {upcoming.map((ev) => {
          const { total, confirmed } = attendeeCounts(ev);
          return (
            <Link
              key={ev.id}
              to="/agenda"
              search={{ id: ev.id, data: ev.event_date }}
              className="dashboard-agenda-item block rounded-lg border border-border/60 bg-background/50 p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(parseIsoDate(ev.event_date), "dd MMM", { locale: ptBR })}
                    {ev.event_time && ` · ${ev.event_time.slice(0, 5)}`}
                    {" · "}
                    {AGENDA_EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
                  </p>
                </div>
                {total > 0 && (
                  <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                    <Users className="h-3 w-3" />
                    {confirmed}/{total}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
