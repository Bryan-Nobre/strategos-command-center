import { AlertCircle, CheckCircle2, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemandasCompactBar({
  total,
  filtered,
  abertas,
  emAndamento,
  resolvidas,
  landingCount,
  className,
}: {
  total: number;
  filtered: number;
  abertas: number;
  emAndamento: number;
  resolvidas: number;
  landingCount: number;
  className?: string;
}) {
  return (
    <div className={cn("demandas-compact-bar", className)}>
      <div className="demandas-compact-stat">
        <span>
          <strong className="tabular-nums">{filtered}</strong>
          {filtered !== total && (
            <span className="text-muted-foreground"> de {total}</span>
          )}{" "}
          no quadro
        </span>
      </div>
      <div className="demandas-compact-stat">
        <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
        <strong className="tabular-nums">{abertas}</strong> abertas
      </div>
      <div className="demandas-compact-stat">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
        <strong className="tabular-nums">{emAndamento}</strong> em andamento
      </div>
      <div className="demandas-compact-stat">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <strong className="tabular-nums">{resolvidas}</strong> resolvidas
      </div>
      <div className="demandas-compact-stat">
        <Globe className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
        <strong className="tabular-nums">{landingCount}</strong> via landing
      </div>
    </div>
  );
}
