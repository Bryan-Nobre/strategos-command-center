import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyMetric } from "@/services/dashboard-intelligence";

export function DailySummaryCard({ metrics }: { metrics: DailyMetric[] }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Resumo operacional do dia</CardTitle>
        <CardDescription>Indicadores da operação em tempo real (dia local)</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 pb-6 md:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-border/80 bg-muted/25 px-3 py-3 text-center"
          >
            <p className="text-2xl font-bold text-heading dark:text-foreground">{m.value}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
