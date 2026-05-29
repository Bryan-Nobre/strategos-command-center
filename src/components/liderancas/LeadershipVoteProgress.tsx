import { cn } from "@/lib/utils";

export function LeadershipVoteProgress({
  pledged,
  target,
  className,
  size = "md",
}: {
  pledged: number;
  target: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const safeTarget = Math.max(target, 0);
  const pct = safeTarget > 0 ? Math.min(100, Math.round((pledged / safeTarget) * 100)) : pledged > 0 ? 100 : 0;
  const over = safeTarget > 0 && pledged > safeTarget;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-muted-foreground">Meta de associados</span>
        <span className={cn("tabular-nums font-semibold", over ? "text-primary" : "text-foreground")}>
          {pledged}
          {safeTarget > 0 ? ` / ${safeTarget}` : ""}
          {safeTarget > 0 && (
            <span className="ml-1 font-normal text-muted-foreground">({pct}%)</span>
          )}
        </span>
      </div>
      <div
        className={cn(
          "lideranca-vote-track overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pledged} de ${safeTarget || "—"} votos estimados`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            over ? "bg-primary" : pct >= 75 ? "bg-primary" : pct >= 40 ? "bg-chart-2" : "bg-chart-3",
          )}
          style={{ width: `${safeTarget > 0 ? Math.min(100, (pledged / safeTarget) * 100) : pledged > 0 ? 100 : 0}%` }}
        />
      </div>
      {safeTarget === 0 && pledged === 0 && (
        <p className="text-[10px] text-muted-foreground">
          Defina a meta em votos estimados e cadastre chapas na landing.
        </p>
      )}
      {over && (
        <p className="text-[10px] font-medium text-primary">Meta superada pelos apoios na landing.</p>
      )}
    </div>
  );
}
