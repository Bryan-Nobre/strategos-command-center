import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KpiContext } from "@/services/dashboard-intelligence";

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
  featured = false,
  context,
}: {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "warning";
  featured?: boolean;
  context?: KpiContext;
}) {
  const displayDelta = context?.deltaPct ?? delta;
  const positive = (displayDelta ?? 0) >= 0;

  const toneIconClass: Record<string, string> = {
    primary: "metric-icon-wrap",
    accent: "metric-icon-wrap",
    success: "metric-icon-wrap",
    warning:
      "flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(245,158,11,0.12)] text-[#d97706] dark:bg-warning/15 dark:text-warning [&_svg]:h-[1.375rem] [&_svg]:w-[1.375rem]",
  };

  return (
    <Card
      className={cn(
        "metric-card transition-theme",
        featured && "card-featured metric-card-featured",
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-heading dark:text-foreground">
              {value}
            </div>
            {typeof displayDelta === "number" && (
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                    positive
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {positive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {positive ? "+" : ""}
                  {displayDelta}%
                </span>
                <span className="text-muted-foreground">vs semana anterior</span>
              </div>
            )}
            {context?.sublabel && (
              <p className="mt-1 text-xs text-muted-foreground">{context.sublabel}</p>
            )}
          </div>
          <div className={cn(toneIconClass[tone])}>
            <Icon />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
