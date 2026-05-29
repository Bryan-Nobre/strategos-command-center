import { Crown, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function LeadershipCompactBar({
  total,
  filtered,
  totalPledged,
  totalTarget,
  className,
}: {
  total: number;
  filtered: number;
  totalPledged: number;
  totalTarget: number;
  className?: string;
}) {
  const pct =
    totalTarget > 0 ? Math.min(100, Math.round((totalPledged / totalTarget) * 100)) : 0;

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
        <Target className="h-4 w-4 text-primary" aria-hidden />
        <span>
          Apoios na landing: <strong className="tabular-nums">{totalPledged}</strong>
          {totalTarget > 0 && (
            <span className="text-muted-foreground"> / meta {totalTarget} ({pct}%)</span>
          )}
        </span>
      </div>
      <div className="eleitores-compact-stat">
        <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="text-muted-foreground">
          Chapas somam na barra de cada liderança conforme seleção na landing
        </span>
      </div>
    </div>
  );
}
