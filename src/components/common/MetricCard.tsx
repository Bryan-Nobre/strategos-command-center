import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label, value, delta, icon: Icon, tone = "primary",
}: {
  label: string; value: string; delta?: number;
  icon: LucideIcon; tone?: "primary" | "accent" | "success" | "warning";
}) {
  const positive = (delta ?? 0) >= 0;
  const toneBg: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
  };
  return (
    <Card className="shadow-elegant transition-shadow hover:shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneBg[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {typeof delta === "number" && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {positive ? "+" : ""}{delta}%
            </span>
            <span className="text-muted-foreground">vs. mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
