import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, ListChecks, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { DashboardPriorityItem } from "@/lib/dashboard-compose";

export function DashboardPriorities({
  items,
  sectionIndex,
}: {
  items: DashboardPriorityItem[];
  sectionIndex: number;
}) {
  if (items.length === 0) {
    return (
      <DashboardSection
        variant="priorities"
        index={sectionIndex}
        title="Prioridades do dia"
        description="Nenhuma prioridade crítica — operação estável."
        icon={Zap}
      >
        <div className="dashboard-empty-positive rounded-lg px-4 py-4 text-sm">
          Continue monitorando territórios e demandas. O sistema avisará quando algo exigir ação.
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection
      variant="priorities"
      index={sectionIndex}
      title="Prioridades do dia"
      description="Até três frentes que exigem decisão imediata."
      icon={Zap}
    >
      <div className="space-y-2">
        {items.map((item) => (
          <article
            key={item.id}
            className={cn(
              "dashboard-priority-row group flex flex-col gap-3 rounded-lg border p-4 transition-theme sm:flex-row sm:items-center sm:justify-between",
              item.kind === "alert" && item.severity === "alta" && "dashboard-priority-row--high",
            )}
          >
            <div className="flex min-w-0 gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  item.kind === "alert" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                )}
              >
                {item.kind === "alert" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <ListChecks className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-border/80 bg-background/80 group-hover:border-primary/30 group-hover:bg-primary/5"
              asChild
            >
              <Link to={item.actionTo} search={item.actionSearch}>
                {item.actionLabel}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </DashboardSection>
  );
}
