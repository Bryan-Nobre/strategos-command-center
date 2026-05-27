import { Link } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { WeeklyGoal } from "@/services/dashboard";

const statusConfig = {
  risco: { label: "Em risco", variant: "outline" as const },
  atrasado: { label: "Atrasado", variant: "destructive" as const },
};

export function DashboardGoalsAtRisk({
  goals,
  sectionIndex,
}: {
  goals: WeeklyGoal[];
  sectionIndex: number;
}) {
  const atRisk = goals.filter((g) => g.status === "risco" || g.status === "atrasado");

  return (
    <DashboardSection
      variant="goals"
      index={sectionIndex}
      title="Metas em atenção"
      description="Somente metas em risco ou atrasadas — leitura rápida do ritmo semanal."
      icon={Target}
      actions={
        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
          <Link to="/configuracoes">Configurar metas</Link>
        </Button>
      }
    >
      {atRisk.length === 0 ? (
        <div className="dashboard-empty-positive flex items-center gap-3 rounded-lg px-4 py-3.5 text-sm">
          <Target className="h-4 w-4 shrink-0 text-primary" />
          <span>Todas as metas estão no ritmo planejado.</span>
        </div>
      ) : (
        <ul className="dashboard-goals-list space-y-2">
          {atRisk.map((goal) => {
            const cfg = statusConfig[goal.status as keyof typeof statusConfig] ?? statusConfig.risco;
            const progress =
              goal.target > 0 ? Math.min(100, Math.round((goal.value / goal.target) * 100)) : 0;
            return (
              <li
                key={goal.id}
                className="dashboard-goal-row rounded-lg border border-border/70 bg-background/60 px-3.5 py-3 transition-theme hover:border-primary/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug text-foreground">{goal.name}</p>
                  <Badge variant={cfg.variant} className="shrink-0 text-[10px]">
                    {cfg.label}
                  </Badge>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {goal.startDate} — {goal.endDate}
                </p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {goal.value}
                    <span className="text-sm font-normal text-muted-foreground"> / {goal.target}</span>
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
