import { Link } from "@tanstack/react-router";
import { AlertCircle, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { DEMAND_CATEGORY_LABELS, DEMAND_STATUS_LABELS } from "@/types/domain";
import type { ReportsSummary } from "@/services/reports";

export function ReportsDemandsSection({ demands }: { demands?: ReportsSummary["demands"] }) {
  const statuses = Object.entries(demands?.byStatus ?? {});
  const maxStatus = Math.max(...statuses.map(([, c]) => c), 1);

  return (
    <ReportsSection
      variant="demands"
      index={5}
      title="Demandas e operação"
      description="Gargalos, SLA e distribuição — foco em decisão de coordenação."
      icon={ClipboardList}
      actions={
        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
          <Link to="/demandas" search={{ responsavel: "none" }}>
            Ver sem responsável
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="text-[10px] font-medium text-muted-foreground">Sem responsável</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">
            {demands?.unassigned ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="text-[10px] font-medium text-muted-foreground">SLA médio (resolvidas)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {demands?.avgResolutionDays ?? 0}
            <span className="text-sm font-normal text-muted-foreground"> dias</span>
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/40 p-3 md:col-span-1">
          <p className="mb-2 text-[10px] font-medium text-muted-foreground">Por status</p>
          <div className="space-y-2">
            {statuses.map(([status, count]) => (
              <div key={status}>
                <div className="mb-0.5 flex justify-between text-[10px]">
                  <span>{DEMAND_STATUS_LABELS[status] ?? status}</span>
                  <span className="font-semibold tabular-nums">{count}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(demands?.byCategory?.length ?? 0) > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
          {demands!.byCategory.map((c) => (
            <Badge key={c.category} variant="secondary" className="text-[10px]">
              {DEMAND_CATEGORY_LABELS[c.category] ?? c.category}: {c.count}
            </Badge>
          ))}
        </div>
      )}

      {(demands?.unassigned ?? 0) >= 3 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
          Acúmulo de demandas sem encarregado — priorize distribuição na equipe.
        </div>
      )}
    </ReportsSection>
  );
}
