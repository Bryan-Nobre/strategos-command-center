import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DailyMetric, QuickPill } from "@/services/dashboard-intelligence";
import type { HeroCta } from "@/lib/dashboard-compose";

function BadgePill({ pill }: { pill: QuickPill }) {
  return (
    <span
      className={cn(
        "dashboard-hero-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        pill.tone === "positive" && "dashboard-hero-badge--positive",
        pill.tone === "warning" && "dashboard-hero-badge--warning",
        pill.tone === "neutral" && "dashboard-hero-badge--neutral",
      )}
    >
      {pill.tone === "positive" && <Sparkles className="h-3 w-3 shrink-0" aria-hidden />}
      {pill.label}
    </span>
  );
}

export function DashboardHero({
  greeting,
  briefing,
  alertLine,
  opportunityLine,
  badges,
  dailyPulse,
  primaryCta,
  secondaryCta,
}: {
  greeting: string;
  briefing: string;
  alertLine?: string;
  opportunityLine?: string;
  badges: QuickPill[];
  dailyPulse: DailyMetric[];
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
}) {
  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero-grid">
        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <h1 className="dashboard-hero-title">{greeting}</h1>
            <p className="dashboard-hero-briefing">{briefing}</p>
          </div>

          {(alertLine || opportunityLine) && (
            <div className="space-y-2 border-l-2 border-primary/35 pl-4">
              {alertLine && (
                <p className="text-sm font-medium text-foreground/90">
                  <span className="text-destructive/90">Prioridade: </span>
                  {alertLine}
                </p>
              )}
              {opportunityLine && (
                <p className="text-sm text-muted-foreground">{opportunityLine}</p>
              )}
            </div>
          )}

          {badges.length > 0 && (
            <div className="dashboard-hero-badges flex w-full min-w-0 flex-wrap gap-2">
              {badges.map((pill) => (
                <BadgePill key={pill.id} pill={pill} />
              ))}
            </div>
          )}

          {dailyPulse.length > 0 && (
            <div className="dashboard-hero-pulse">
              {dailyPulse.map((m) => (
                <div key={m.label} className="dashboard-hero-pulse-item">
                  <span className="dashboard-hero-pulse-value">{m.value}</span>
                  <span className="dashboard-hero-pulse-label">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col lg:items-stretch">
          <Button asChild size="lg" className="dashboard-hero-cta-primary h-11">
            <Link to={primaryCta.to} search={primaryCta.search}>
              {primaryCta.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="dashboard-hero-cta-secondary h-11">
            <Link to={secondaryCta.to} search={secondaryCta.search}>
              {secondaryCta.label}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
