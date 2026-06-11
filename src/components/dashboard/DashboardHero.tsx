import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingPublicPath } from "@/lib/landing-routes";
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
  landingPublicCode,
  alertLine,
  opportunityLine,
  badges,
  dailyPulse,
  primaryCta,
  secondaryCta,
}: {
  greeting: string;
  briefing: string;
  /** Código público da landing — link rápido abaixo da saudação. */
  landingPublicCode?: string | null;
  alertLine?: string;
  opportunityLine?: string;
  badges: QuickPill[];
  dailyPulse: DailyMetric[];
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
}) {
  const landingCode = landingPublicCode?.trim().toLowerCase() ?? "";
  const landingPath = landingCode ? landingPublicPath(landingCode) : null;
  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero-grid">
        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <h1 className="dashboard-hero-title">{greeting}</h1>
            {landingPath ? (
              <div className="dashboard-hero-landing flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
                <Link
                  to="/landpage/$code"
                  params={{ code: landingCode }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{landingPath}</span>
                </Link>
                <span className="text-muted-foreground/60" aria-hidden>
                  ·
                </span>
                <Link
                  to="/configuracoes"
                  search={{ tab: "landing" }}
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Settings2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Configurar landing
                </Link>
              </div>
            ) : (
              <Link
                to="/configuracoes"
                search={{ tab: "landing" }}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Settings2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Configurar sua landing pública
              </Link>
            )}
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
