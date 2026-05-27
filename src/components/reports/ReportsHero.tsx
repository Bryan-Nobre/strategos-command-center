import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPeriodLabel, type ReportsDateRange } from "@/lib/reports-period";
import type { ReportsSummary } from "@/services/reports";

export function ReportsHero({
  range,
  pulse,
  onExportExecutive,
  exportDisabled,
  pdfComingSoon,
}: {
  range: ReportsDateRange;
  pulse: ReportsSummary["pulse"] | undefined;
  onExportExecutive: () => void;
  exportDisabled?: boolean;
  pdfComingSoon?: boolean;
}) {
  const growth = pulse?.growthPct;

  return (
    <section className="reports-hero">
      <div className="reports-hero-grid">
        <div className="min-w-0 space-y-3">
          <p className="reports-hero-eyebrow">Central analítica</p>
          <h1 className="reports-hero-title">Relatórios da campanha</h1>
          <p className="reports-hero-subtitle">
            Análise consolidada da operação, território e crescimento político — leitura para
            coordenação e reunião.
          </p>
          <p className="text-xs font-medium text-muted-foreground">{formatPeriodLabel(range)}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <Button
            size="lg"
            className="h-11"
            onClick={onExportExecutive}
            disabled={exportDisabled}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar relatório executivo
          </Button>
          {pdfComingSoon && (
            <Button variant="outline" size="lg" className="h-11" disabled>
              PDF executivo (em breve)
            </Button>
          )}
        </div>
      </div>

      <div className="reports-hero-pulse">
        <PulseItem label="Novos apoiadores" value={pulse?.newSupporters ?? "—"} />
        <PulseItem
          label="Crescimento"
          value={growth === null || growth === undefined ? "—" : `${growth >= 0 ? "+" : ""}${growth}%`}
          trend={growth === null || growth === undefined ? null : growth >= 0 ? "up" : "down"}
        />
        <PulseItem label="Demandas resolvidas" value={pulse?.resolvedDemands ?? "—"} />
        <PulseItem label="Territórios críticos" value={pulse?.criticalTerritories ?? "—"} warn />
      </div>
    </section>
  );
}

function PulseItem({
  label,
  value,
  trend,
  warn,
}: {
  label: string;
  value: string | number;
  trend?: "up" | "down" | null;
  warn?: boolean;
}) {
  return (
    <div className={cn("reports-hero-pulse-item", warn && "reports-hero-pulse-item--warn")}>
      <span className="reports-hero-pulse-value">{value}</span>
      <span className="flex items-center gap-1">
        <span className="reports-hero-pulse-label">{label}</span>
        {trend === "up" && <TrendingUp className="h-3 w-3 text-success" aria-hidden />}
        {trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" aria-hidden />}
      </span>
    </div>
  );
}
