import { LEADERSHIP_POINTS_HELP } from "@/lib/leadership-metrics-copy";
import { cn } from "@/lib/utils";

export function LeadershipVoteProgress({
  points,
  target,
  landpagePoints,
  className,
  size = "md",
}: {
  points: number;
  target: number;
  /** Pontos vindos só da landpage (detalhe opcional). */
  landpagePoints?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const safeTarget = Math.max(target, 0);
  const pct =
    safeTarget > 0 ? Math.min(100, Math.round((points / safeTarget) * 100)) : points > 0 ? 100 : 0;
  const over = safeTarget > 0 && points > safeTarget;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-muted-foreground">Meta (pontos)</span>
        <span className={cn("tabular-nums font-semibold", over ? "text-primary" : "text-foreground")}>
          {points}
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
        aria-label={`${points} de ${safeTarget || "—"} pontos na meta`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            over ? "bg-primary" : pct >= 75 ? "bg-primary" : pct >= 40 ? "bg-chart-2" : "bg-chart-3",
          )}
          style={{
            width: `${safeTarget > 0 ? Math.min(100, (points / safeTarget) * 100) : points > 0 ? 100 : 0}%`,
          }}
        />
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        {LEADERSHIP_POINTS_HELP.metaProgress}
      </p>
      {landpagePoints != null && landpagePoints > 0 && (
        <p className="text-[10px] text-muted-foreground">
          Destes, <strong className="text-foreground tabular-nums">{landpagePoints}</strong>{" "}
          {landpagePoints === 1 ? "apoiador veio" : "apoiadores vieram"} da landpage (apoio a chapas).
        </p>
      )}
      {safeTarget === 0 && points === 0 && (
        <p className="text-[10px] text-muted-foreground">
          Defina a meta em pontos (associados estimados) e cadastre chapas na landpage.
        </p>
      )}
      {over && (
        <p className="text-[10px] font-medium text-primary">Meta de pontos superada pela rede atual.</p>
      )}
    </div>
  );
}
