import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OperationalAlert } from "@/services/dashboard-intelligence";

export function ActionableAlerts({ alerts }: { alerts: OperationalAlert[] }) {
  if (!alerts.length) {
    return (
      <div className="rounded-2xl border border-border/80 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
        Nenhum alerta operacional crítico — continue monitorando territórios e demandas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <article
          key={alert.id}
          className="alert-operational flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex gap-3">
            <div className="alert-operational-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-heading dark:text-foreground">
                  {alert.title}
                </p>
                <span
                  className={
                    alert.severity === "alta"
                      ? "rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-destructive"
                      : "rounded-full bg-[rgba(245,158,11,0.15)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#b45309]"
                  }
                >
                  {alert.severity === "alta" ? "Alta" : "Média"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{alert.description}</p>
              <p className="text-xs font-medium text-foreground/80">Sugestão: {alert.suggestion}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link to={alert.actionTo} search={alert.actionSearch}>
              {alert.actionLabel}
            </Link>
          </Button>
        </article>
      ))}
    </div>
  );
}
