import { BarChart3, LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { KpiContext } from "@/services/dashboard-intelligence";

export type DashboardKpiItem = {
  label: string;
  value: string;
  icon: LucideIcon;
  context?: KpiContext;
  tone?: "primary" | "warning";
};

function MicroTrend({ delta }: { delta: number | null | undefined }) {
  if (delta === null || delta === undefined) {
    return <div className="dashboard-kpi-spark dashboard-kpi-spark--flat" aria-hidden />;
  }
  const positive = delta >= 0;
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <div className={cn("dashboard-kpi-spark", positive ? "dashboard-kpi-spark--up" : "dashboard-kpi-spark--down")} />
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-[10px] font-semibold",
          positive ? "text-success" : "text-destructive",
        )}
      >
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {positive ? "+" : ""}
        {delta}%
      </span>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, context, tone = "primary" }: DashboardKpiItem) {
  return (
    <div className={cn("dashboard-kpi-card transition-theme", tone === "warning" && "dashboard-kpi-card--warning")}>
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            tone === "warning" ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <MicroTrend delta={context?.deltaPct} />
      </div>
      <p className="mt-4 text-[11px] font-medium tracking-wide text-muted-foreground">{label}</p>
      <p className="dashboard-kpi-value mt-1 tabular-nums">{value}</p>
      {context?.sublabel && (
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/90">{context.sublabel}</p>
      )}
    </div>
  );
}

export function DashboardKpiStrip({
  items,
  sectionIndex,
}: {
  items: DashboardKpiItem[];
  sectionIndex: number;
}) {
  return (
    <DashboardSection
      variant="kpis"
      index={sectionIndex}
      title="Indicadores estratégicos"
      description="Leitura consolidada da base e da operação."
      icon={BarChart3}
      unstyledBody
      bodyClassName="dashboard-kpi-grid"
    >
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </DashboardSection>
  );
}
