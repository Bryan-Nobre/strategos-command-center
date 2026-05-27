import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FUNNEL_STAGES, SUPPORTER_STATUS_LABELS } from "@/types/domain";
import { cn } from "@/lib/utils";

export function PoliticalPipeline({ funnel }: { funnel: Record<string, number> }) {
  const stageRows = FUNNEL_STAGES.map((stage) => ({
    ...stage,
    count: funnel[stage.key] ?? 0,
  }));

  const extras = Object.entries(funnel).filter(([k]) => !FUNNEL_STAGES.some((s) => s.key === k));

  const totalBase = Object.values(funnel).reduce((a, b) => a + b, 0) || 1;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Pipeline da base</CardTitle>
        <CardDescription>
          Distribuição por estágio — proporção do total, não conversão causal entre etapas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">Etapa</th>
                <th className="pb-2 font-medium">Total</th>
                <th className="pb-2 font-medium">% da base</th>
                <th className="pb-2 font-medium">Proporção vs etapa anterior</th>
              </tr>
            </thead>
            <tbody>
              {stageRows.map((row, idx) => {
                const share = Math.round((row.count / totalBase) * 100);
                const prev = idx > 0 ? stageRows[idx - 1]!.count : null;
                const ratio = prev && prev > 0 ? `${Math.round((row.count / prev) * 100)}%` : "—";
                return (
                  <tr key={row.key} className="border-b border-border/50">
                    <td className="py-3 font-medium">{row.label}</td>
                    <td className="py-3">{row.count}</td>
                    <td className="py-3">{share}%</td>
                    <td className="py-3 text-muted-foreground">{ratio}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 md:hidden">
          {stageRows.map((row, idx) => {
            const share = Math.round((row.count / totalBase) * 100);
            return (
              <div key={row.key} className="rounded-xl border border-border/80 p-3">
                <p className="font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">
                  {row.count} · {share}% da base
                  {idx > 0 && stageRows[idx - 1]!.count > 0
                    ? ` · ${Math.round((row.count / stageRows[idx - 1]!.count) * 100)}% vs anterior`
                    : ""}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-stretch gap-2">
          {stageRows.map((row, idx) => (
            <div key={row.key} className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex min-h-[4.5rem] flex-1 flex-col justify-center rounded-xl border border-primary/20 bg-primary/5 px-3 py-2",
                )}
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </span>
                <span className="text-lg font-bold text-heading dark:text-foreground">
                  {row.count}
                </span>
              </div>
              {idx < stageRows.length - 1 && (
                <span className="hidden text-muted-foreground sm:inline" aria-hidden>
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        {extras.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            {extras.map(([k, v]) => (
              <span
                key={k}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {SUPPORTER_STATUS_LABELS[k] ?? k}: {v}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
