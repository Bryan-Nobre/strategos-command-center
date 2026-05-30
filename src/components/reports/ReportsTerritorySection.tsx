import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { cn } from "@/lib/utils";
import type { ReportsSummary } from "@/services/reports";

const riskLabel: Record<string, string> = {
  critico: "Risco alto",
  atencao: "Atenção",
  promissor: "Promissor",
};

function TerritoryTable({
  title,
  rows,
  variant,
}: {
  title: string;
  rows: ReportsSummary["territories"]["critical"];
  variant: "critical" | "promising";
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-xs text-muted-foreground">
          Nenhum território nesta leitura.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="reports-territory-table w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-[10px] text-muted-foreground">
                <th className="pb-2 pr-2 font-medium">#</th>
                <th className="pb-2 pr-2 font-medium">Bairro</th>
                <th className="pb-2 pr-2 font-medium">Score</th>
                <th className="pb-2 pr-2 font-medium hidden sm:table-cell">Base</th>
                <th className="pb-2 pr-2 font-medium hidden md:table-cell">Forte</th>
                <th className="pb-2 font-medium hidden md:table-cell">Indec.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => (
                <tr
                  key={t.neighborhood}
                  className="border-b border-border/40 transition-theme hover:bg-muted/30"
                >
                  <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="py-2.5 pr-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground">{t.neighborhood}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "w-fit text-[9px]",
                          variant === "critical" && "border-destructive/30 text-destructive",
                          variant === "promising" && "border-primary/30 text-primary",
                        )}
                      >
                        {riskLabel[t.risk_level] ?? t.risk_level}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums">{t.display_score}</span>
                      <div className="h-1.5 w-16 max-w-[4rem] overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            variant === "critical" ? "bg-destructive/70" : "bg-primary",
                          )}
                          style={{ width: `${Math.min(100, t.display_score)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="hidden py-2.5 pr-2 tabular-nums sm:table-cell">{t.supporters}</td>
                  <td className="hidden py-2.5 pr-2 md:table-cell">{t.strongSupportPct}%</td>
                  <td className="hidden py-2.5 md:table-cell">{t.undecidedPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ReportsTerritorySection({
  territories,
  neighborhoodFilter,
}: {
  territories?: ReportsSummary["territories"];
  neighborhoodFilter?: string | null;
}) {
  return (
    <ReportsSection
      variant="territory"
      index={3}
      id="reports-territory"
      title="Inteligência territorial"
      description={
        neighborhoodFilter
          ? `Ranking filtrado pelo bairro do CEP: ${neighborhoodFilter}.`
          : "Ranking de riscos e oportunidades — leitura política por bairro."
      }
      icon={MapPin}
      actions={
        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
          <Link to="/eleitores">Ver base territorial</Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TerritoryTable title="Críticos" rows={territories?.critical ?? []} variant="critical" />
        <TerritoryTable title="Promissores" rows={territories?.promising ?? []} variant="promising" />
      </div>
    </ReportsSection>
  );
}
