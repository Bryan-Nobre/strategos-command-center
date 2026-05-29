import { BarChart3, Globe, Sparkles } from "lucide-react";
import { formatAnalyticsPeriodLabel, type AnalyticsDateRange } from "@/lib/analytics-period";
import type { ReportsSummary } from "@/services/reports";

export function PesquisasHero({
  range,
  pulse,
}: {
  range: AnalyticsDateRange;
  pulse: ReportsSummary["pulse"] | undefined;
}) {
  const growth = pulse?.growthPct;

  return (
    <section className="reports-hero pesquisas-hero">
      <div className="reports-hero-grid">
        <div className="min-w-0 space-y-3">
          <p className="reports-hero-eyebrow">Cenário eleitoral</p>
          <h1 className="reports-hero-title">Pesquisas e indicadores</h1>
          <p className="reports-hero-subtitle">
            Crescimento real da base no período selecionado, território por bairro e leitura
            eleitoral — intenção e aprovação serão alimentadas pela landing no DF.
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {formatAnalyticsPeriodLabel(range)}
          </p>
        </div>
        <div className="pesquisas-hero-badges">
          <span className="pesquisas-source-badge pesquisas-source-badge--crm">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            CRM automático
          </span>
          <span className="pesquisas-source-badge pesquisas-source-badge--landing">
            <Globe className="h-3.5 w-3.5" aria-hidden />
            Landing DF (em breve)
          </span>
        </div>
      </div>

      <div className="reports-hero-pulse">
        <PulseItem label="Novos no período" value={pulse?.newSupporters ?? "—"} />
        <PulseItem
          label="Crescimento"
          value={
            growth === null || growth === undefined ? "—" : `${growth >= 0 ? "+" : ""}${growth}%`
          }
        />
        <PulseItem label="Apoio forte (base)" value={pulse ? "Ver KPIs" : "—"} hint="Abaixo" />
        <PulseItem label="Territórios críticos" value={pulse?.criticalTerritories ?? "—"} warn />
      </div>

      <div className="pesquisas-hero-note">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Use o filtro de período para alinhar gráficos e território. Pesquisas de intenção e
          aprovação por bairro continuam editáveis até a captura automática na landing.
        </p>
      </div>
    </section>
  );
}

function PulseItem({
  label,
  value,
  warn,
  hint,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
  hint?: string;
}) {
  return (
    <div className={warn ? "reports-hero-pulse-item reports-hero-pulse-item--warn" : "reports-hero-pulse-item"}>
      <span className="reports-hero-pulse-value">{value}</span>
      <span className="reports-hero-pulse-label">
        {label}
        {hint && <span className="ml-1 text-[9px] opacity-70">· {hint}</span>}
      </span>
    </div>
  );
}
