import { GitBranch } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FUNNEL_STAGES } from "@/types/domain";

export function DashboardPipelineSlim({
  funnel,
  sectionIndex,
}: {
  funnel: Record<string, number>;
  sectionIndex: number;
}) {
  const stages = FUNNEL_STAGES.map((stage, idx) => {
    const count = funnel[stage.key] ?? 0;
    const prev = idx > 0 ? (funnel[FUNNEL_STAGES[idx - 1]!.key] ?? 0) : null;
    const conversion = prev && prev > 0 ? Math.round((count / prev) * 100) : null;
    return { ...stage, count, conversion };
  });

  const total = stages.reduce((acc, s) => acc + s.count, 0) || 1;

  return (
    <DashboardSection
      variant="pipeline"
      index={sectionIndex}
      title="Pipeline da base"
      description="Jornada Interessado → Apoiador → Liderança — proporção do total cadastrado."
      icon={GitBranch}
      unstyledBody
      bodyClassName="dashboard-pipeline-slim p-4 md:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-2">
        {stages.map((stage, idx) => (
          <div key={stage.key} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="dashboard-pipeline-stage flex min-h-[5.5rem] flex-1 flex-col justify-center rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-3">
              <span className="text-[10px] font-medium text-muted-foreground">{stage.label}</span>
              <span className="mt-1 text-2xl font-bold tabular-nums text-foreground">{stage.count}</span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                {Math.round((stage.count / total) * 100)}% da base
                {stage.conversion !== null ? ` · ${stage.conversion}% conv.` : ""}
              </span>
            </div>
            {idx < stages.length - 1 && (
              <span className="hidden shrink-0 text-muted-foreground/50 md:inline" aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
