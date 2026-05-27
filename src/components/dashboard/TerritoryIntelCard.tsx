import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EnrichedTerritory } from "@/services/dashboard-intelligence";
import { cn } from "@/lib/utils";

const riskStyles = {
  critico:
    "border-[rgba(220,80,80,0.25)] bg-[rgba(220,80,80,0.06)] dark:border-destructive/30 dark:bg-destructive/10",
  atencao:
    "border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.06)] dark:border-warning/25 dark:bg-warning/10",
  promissor:
    "border-[rgba(16,148,74,0.22)] bg-[rgba(16,148,74,0.06)] dark:border-primary/25 dark:bg-primary/10",
};

const riskLabel = {
  critico: "Risco alto",
  atencao: "Atenção",
  promissor: "Promissor",
};

export function TerritoryIntelCard({
  title,
  description,
  territories,
  variant,
}: {
  title: string;
  description: string;
  territories: EnrichedTerritory[];
  variant: "critical" | "promising";
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-6">
        {territories.map((t) => (
          <div
            key={t.neighborhood}
            className={cn("rounded-xl border p-4 transition-theme", riskStyles[t.riskLevel])}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-heading dark:text-foreground">{t.neighborhood}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Score territorial:{" "}
                  <span className="font-medium text-foreground">{t.displayScore}/100</span>
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                {riskLabel[t.riskLevel]}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {variant === "critical" ? (
                <>
                  Base {t.supporters} · Forte {t.strongSupportPct}% · Indecisos {t.undecidedPct}% ·
                  Demandas {t.openDemands}
                </>
              ) : (
                <>
                  Base {t.supporters} · Forte {t.strongSupportPct}% · Oposição {t.oppositionPct}%
                </>
              )}
            </p>
            <Button variant="ghost" size="sm" className="mt-3 h-8 px-2 text-xs" asChild>
              <Link to="/eleitores" search={{ bairro: t.neighborhood }}>
                Ver território
              </Link>
            </Button>
          </div>
        ))}
        {!territories.length && (
          <p className="text-sm text-muted-foreground">
            {variant === "critical"
              ? "Sem territórios críticos no momento."
              : "Ainda sem dados suficientes."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
