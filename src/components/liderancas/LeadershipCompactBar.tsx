import { Crown, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function LeadershipCompactBar({
  total,
  filtered,
  totalLinked,
  totalPrimary,
  totalWeeklyGrowth,
  className,
}: {
  total: number;
  filtered: number;
  totalLinked: number;
  totalPrimary: number;
  totalWeeklyGrowth: number;
  className?: string;
}) {
  return (
    <div className={cn("eleitores-compact-bar liderancas-compact-bar", className)}>
      <div className="eleitores-compact-stat">
        <Crown className="h-4 w-4 text-chart-3" aria-hidden />
        <span>
          <strong className="tabular-nums">{filtered}</strong>
          {filtered !== total && (
            <span className="text-muted-foreground"> de {total}</span>
          )}{" "}
          lideranças
        </span>
      </div>
      <div className="eleitores-compact-stat">
        <Users className="h-4 w-4 text-primary" aria-hidden />
        <span>
          Na rede: <strong className="tabular-nums">{totalLinked}</strong>
          <span className="text-muted-foreground">
            {" "}
            · <strong className="tabular-nums text-foreground">{totalPrimary}</strong> primários
          </span>
        </span>
      </div>
      <div className="eleitores-compact-stat">
        <TrendingUp className="h-4 w-4 text-chart-2" aria-hidden />
        <span className="text-muted-foreground">
          <strong className="tabular-nums text-foreground">{totalWeeklyGrowth}</strong> novos vínculos
          nos últimos 7 dias
        </span>
      </div>
    </div>
  );
}
