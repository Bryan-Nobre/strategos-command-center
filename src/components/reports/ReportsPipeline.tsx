import { GitBranch } from "lucide-react";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { cn } from "@/lib/utils";
import type { ReportsSummary } from "@/services/reports";

const STAGES = [
  { key: "interessado" as const, label: "Interessado" },
  { key: "apoiador" as const, label: "Apoiador" },
  { key: "apoioForte" as const, label: "Apoio forte" },
  { key: "lideranca" as const, label: "Liderança" },
];

export function ReportsPipeline({ funnel }: { funnel?: ReportsSummary["funnel"] }) {
  const values = STAGES.map((s) => funnel?.[s.key] ?? 0);
  const max = Math.max(...values, 1);

  return (
    <ReportsSection
      variant="pipeline"
      index={4}
      title="Funil político"
      description="Jornada da base com conversão entre etapas e crescimento no período."
      icon={GitBranch}
      unstyledBody
      bodyClassName="reports-pipeline-panel p-4 md:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
        {STAGES.map((stage, idx) => {
          const count = funnel?.[stage.key] ?? 0;
          const prev = idx > 0 ? (funnel?.[STAGES[idx - 1]!.key] ?? 0) : null;
          const conversion = prev && prev > 0 ? Math.round((count / prev) * 100) : null;
          const drop = prev && prev > count ? prev - count : 0;
          return (
            <div key={stage.key} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="reports-pipeline-stage flex flex-1 flex-col justify-center px-3 py-3">
                <span className="text-[10px] font-medium text-muted-foreground">{stage.label}</span>
                <span className="mt-1 text-2xl font-bold tabular-nums">{count}</span>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${Math.round((count / max) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {conversion !== null ? `${conversion}% conv.` : "Entrada"}
                  {drop > 0 ? ` · −${drop} perda` : ""}
                </p>
              </div>
              {idx < STAGES.length - 1 && (
                <span className="hidden text-muted-foreground/40 md:inline" aria-hidden>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>
      {funnel && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          <span className="font-medium text-primary">+{funnel.newInPeriod}</span> novos cadastros no
          período filtrado.
        </p>
      )}
    </ReportsSection>
  );
}
