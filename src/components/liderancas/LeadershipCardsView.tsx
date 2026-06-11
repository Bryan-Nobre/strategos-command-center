import { Crown, Pencil, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LeadershipVoteProgress } from "@/components/liderancas/LeadershipVoteProgress";
import type { LeadershipListItem } from "@/components/liderancas/leadership-list-types";
import { leadershipLandpagePoints, leadershipTotalPoints } from "@/lib/leadership-points";
import { DEEP_LINK_HIGHLIGHT_CLASS } from "@/lib/search-deep-link";
import { cn } from "@/lib/utils";

export function LeadershipCardsView({
  rows,
  highlightId,
  highlightRef,
  onOpen,
  onDelete,
  canUpdate,
  canDelete,
}: {
  rows: LeadershipListItem[];
  highlightId?: string;
  highlightRef: React.RefObject<HTMLDivElement | null>;
  onOpen: (row: LeadershipListItem) => void;
  onDelete: (row: LeadershipListItem) => void;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((l) => (
        <Card
          key={l.leadership_id}
          ref={l.leadership_id === highlightId ? highlightRef : undefined}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(l)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(l);
            }
          }}
          className={cn(
            "lideranca-card shadow-elegant cursor-pointer transition-theme hover:border-primary/25",
            l.leadership_id === highlightId && DEEP_LINK_HIGHLIGHT_CLASS,
          )}
        >
          <CardContent className="p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <div
                  className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary"
                  title="Pontos totais da rede"
                >
                  <span className="text-sm font-bold tabular-nums leading-none">
                    {leadershipTotalPoints(l)}
                  </span>
                  <span className="text-[8px] font-medium uppercase tracking-wide opacity-80">pts</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Crown className="h-4 w-4 shrink-0 text-chart-3" aria-hidden />
                    <h3 className="truncate font-semibold">{l.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{l.leadership_region ?? "Sem região"}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-0.5" onClick={(e) => e.stopPropagation()}>
                {canUpdate && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpen(l)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(l)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span>
                <strong className="text-foreground">{l.linked_supporters}</strong>
                <span className="text-muted-foreground"> apoiadores</span>
              </span>
              {l.weekly_growth > 0 && (
                <span className="inline-flex items-center gap-0.5 text-chart-2">
                  <TrendingUp className="h-3 w-3" aria-hidden />
                  +{l.weekly_growth} / 7d
                </span>
              )}
              {l.landing_only_network && l.linked_supporters > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  Só landing
                </Badge>
              )}
            </div>

            {l.top_neighborhood && (
              <p className="mb-2 truncate text-xs text-muted-foreground">
                {l.top_neighborhood}
                {l.top_neighborhood_concentration_pct != null &&
                  ` · ${l.top_neighborhood_concentration_pct}%`}
              </p>
            )}

            <LeadershipVoteProgress
              points={leadershipTotalPoints(l)}
              target={l.estimated_votes}
              landpagePoints={leadershipLandpagePoints(l)}
              size="sm"
              className="opacity-90"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
