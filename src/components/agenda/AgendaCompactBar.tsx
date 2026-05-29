import { Calendar, CalendarDays, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function AgendaCompactBar({
  hoje,
  semana,
  proximos7,
  comApoiadores,
  className,
}: {
  hoje: number;
  semana: number;
  proximos7: number;
  comApoiadores: number;
  className?: string;
}) {
  return (
    <div className={cn("agenda-compact-bar", className)}>
      <div className="agenda-compact-stat">
        <Calendar className="h-4 w-4 text-primary" aria-hidden />
        <span>
          <strong className="tabular-nums">{hoje}</strong> hoje
        </span>
      </div>
      <div className="agenda-compact-stat">
        <CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
        <span>
          <strong className="tabular-nums">{semana}</strong> esta semana
        </span>
      </div>
      <div className="agenda-compact-stat">
        <span className="text-muted-foreground">Próx. 7 dias:</span>
        <strong className="tabular-nums">{proximos7}</strong>
      </div>
      <div className="agenda-compact-stat">
        <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
        <span>
          <strong className="tabular-nums">{comApoiadores}</strong> com apoiadores
        </span>
      </div>
    </div>
  );
}
