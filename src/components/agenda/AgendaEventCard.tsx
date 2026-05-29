import { MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { AgendaEventWithRelations } from "@/services/agenda";
import {
  AGENDA_EVENT_STATUS_LABELS,
  AGENDA_EVENT_TYPE_LABELS,
} from "@/types/domain";
import { attendeeCounts } from "@/lib/agenda-utils";
import { DEEP_LINK_HIGHLIGHT_CLASS } from "@/lib/search-deep-link";
import { cn } from "@/lib/utils";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  agendado: "secondary",
  confirmado: "default",
  realizado: "outline",
  cancelado: "destructive",
};

export function AgendaEventCard({
  event,
  highlight,
  canUpdate,
  canDelete,
  onOpen,
  onEdit,
  onDelete,
  showDate = false,
}: {
  event: AgendaEventWithRelations;
  highlight?: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showDate?: boolean;
}) {
  const { total, confirmed } = attendeeCounts(event);

  return (
    <Card
      className={cn(
        "agenda-event-card cursor-pointer shadow-sm transition-shadow hover:shadow-md",
        highlight && DEEP_LINK_HIGHLIGHT_CLASS,
        event.status === "cancelado" && "opacity-60",
      )}
      onClick={onOpen}
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {AGENDA_EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
            </Badge>
            <Badge variant={statusVariant[event.status] ?? "secondary"} className="text-[10px]">
              {AGENDA_EVENT_STATUS_LABELS[event.status] ?? event.status}
            </Badge>
            {total > 0 && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Users className="h-3 w-3" />
                {confirmed}/{total}
              </Badge>
            )}
          </div>
          <h3 className="mt-1.5 font-semibold leading-snug">{event.title}</h3>
          <p className="text-sm text-muted-foreground">
            {showDate && `${event.event_date} · `}
            {event.event_time?.slice(0, 5) ?? "Sem horário"}
            {event.leaderships?.name && ` · ${event.leaderships.name}`}
          </p>
          {(event.location || event.neighborhood) && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {[event.location, event.neighborhood].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5" onClick={(e) => e.stopPropagation()}>
          {canUpdate && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
