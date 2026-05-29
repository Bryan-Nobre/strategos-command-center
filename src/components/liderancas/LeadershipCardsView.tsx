import { Crown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LeadershipVoteProgress } from "@/components/liderancas/LeadershipVoteProgress";
import type { LeadershipListItem } from "@/components/liderancas/LeadershipDetailSheet";
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
          key={l.id}
          ref={l.id === highlightId ? highlightRef : undefined}
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
            l.id === highlightId && DEEP_LINK_HIGHLIGHT_CLASS,
          )}
        >
          <CardContent className="p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Crown className="h-5 w-5 shrink-0 text-chart-3" aria-hidden />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{l.name}</h3>
                  <p className="text-xs text-muted-foreground">{l.region ?? "Sem região"}</p>
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

            <LeadershipVoteProgress
              pledged={l.pledged_votes}
              target={l.estimated_votes}
              size="sm"
              className="mb-3"
            />

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{l.apoiadores}</strong> apoiadores CRM
              </span>
              <span>
                <strong className="text-foreground">{l.chapa_count}</strong> chapa(s)
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
