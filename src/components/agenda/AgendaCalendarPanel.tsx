import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { datesWithEvents } from "@/lib/agenda-utils";
import type { AgendaEventWithRelations } from "@/services/agenda";

export function AgendaCalendarPanel({
  selectedDate,
  events,
  onSelectDate,
}: {
  selectedDate: Date;
  events: AgendaEventWithRelations[];
  onSelectDate: (d: Date | undefined) => void;
}) {
  const eventDates = datesWithEvents(events);

  return (
    <Card className="shadow-elegant lg:col-span-1">
      <CardContent className="p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          className="rounded-md"
          modifiers={{ hasEvent: eventDates }}
          modifiersClassNames={{
            hasEvent:
              "relative font-semibold after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
          }}
        />
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Dias com ponto = eventos agendados
        </p>
      </CardContent>
    </Card>
  );
}
