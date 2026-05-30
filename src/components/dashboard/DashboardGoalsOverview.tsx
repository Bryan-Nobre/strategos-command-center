import { Link } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import {
  GOAL_METRIC_LABELS,
  GOAL_STATUS_LABELS,
} from "@/lib/goal-metrics";
import type { ManualGoalMetric, WeeklyGoal } from "@/services/dashboard";

function goalProgress(goal: WeeklyGoal): number {
  return goal.target > 0 ? Math.min(100, Math.round((goal.value / goal.target) * 100)) : 0;
}

export function DashboardGoalsOverview({
  goals,
  sectionIndex,
}: {
  goals: WeeklyGoal[];
  sectionIndex: number;
}) {
  return (
    <DashboardSection
      variant="goals"
      index={sectionIndex}
      title="Metas da campanha"
      description="Todas as metas ativas no período configurado — captação na landing e demandas concluídas contam separadamente."
      icon={Target}
      actions={
        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
          <Link to="/configuracoes" search={{ tab: "metas" }}>
            Configurar metas
          </Link>
        </Button>
      }
    >
      {goals.length === 0 ? (
        <div className="dashboard-goals-empty rounded-lg border border-dashed px-4 py-6 text-center text-sm">
          <Target className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-2 font-medium text-foreground">Nenhuma meta configurada</p>
          <p className="mt-1 text-muted-foreground">
            Defina metas de captação na landing ou de demandas concluídas em Configurações.
          </p>
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link to="/configuracoes" search={{ tab: "metas" }}>
              Criar metas
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="dashboard-goals-list space-y-2">
          {goals.map((goal) => {
            const statusCfg =
              GOAL_STATUS_LABELS[goal.status] ?? GOAL_STATUS_LABELS.atrasado;
            const metricLabel =
              GOAL_METRIC_LABELS[goal.metric as ManualGoalMetric] ?? goal.metric;
            const progress = goalProgress(goal);

            return (
              <li
                key={goal.id}
                className="dashboard-goal-row rounded-lg border border-border/70 bg-background/60 px-3.5 py-3 transition-theme hover:border-primary/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug text-foreground">{goal.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{metricLabel}</p>
                  </div>
                  <Badge variant={statusCfg.variant} className="shrink-0 text-[10px]">
                    {statusCfg.label}
                  </Badge>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {goal.startDate} — {goal.endDate}
                </p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {goal.value}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / {goal.target}
                    </span>
                  </p>
                  <span className="text-[10px] font-medium text-muted-foreground">{progress}%</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="dashboard-goal-progress h-full rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
}
