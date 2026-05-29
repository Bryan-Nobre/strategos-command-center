import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadershipVoteProgress } from "@/components/liderancas/LeadershipVoteProgress";
import type { LeadershipListItem } from "@/components/liderancas/leadership-list-types";
import { DEEP_LINK_HIGHLIGHT_CLASS } from "@/lib/search-deep-link";
import { cn } from "@/lib/utils";

export function LeadershipTableView({
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
  highlightRef: React.RefObject<HTMLTableRowElement | null>;
  onOpen: (row: LeadershipListItem) => void;
  onDelete: (row: LeadershipListItem) => void;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="overflow-x-auto p-2">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-14">Força</TableHead>
            <TableHead>Liderança</TableHead>
            <TableHead className="hidden sm:table-cell">Rede P/S</TableHead>
            <TableHead className="hidden md:table-cell">+7d</TableHead>
            <TableHead className="hidden lg:table-cell">Território</TableHead>
            <TableHead className="hidden xl:table-cell min-w-[140px]">Landing</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((l) => (
            <TableRow
              key={l.leadership_id}
              ref={l.leadership_id === highlightId ? highlightRef : undefined}
              className={cn(
                "cursor-pointer hover:bg-muted/40",
                l.leadership_id === highlightId && DEEP_LINK_HIGHLIGHT_CLASS,
              )}
              onClick={() => onOpen(l)}
            >
              <TableCell className="tabular-nums font-semibold">{l.political_strength_score}</TableCell>
              <TableCell>
                <div className="font-medium">{l.name}</div>
                <p className="text-xs text-muted-foreground">{l.leadership_region ?? "Sem região"}</p>
                {l.landing_only_network && l.linked_supporters > 0 && (
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    Só landing
                  </Badge>
                )}
              </TableCell>
              <TableCell className="hidden tabular-nums sm:table-cell">
                <span className="font-medium">{l.primary_supporters}</span>
                <span className="text-muted-foreground"> / {l.secondary_supporters}</span>
              </TableCell>
              <TableCell className="hidden tabular-nums md:table-cell">
                {l.weekly_growth > 0 ? (
                  <span className="text-chart-2">+{l.weekly_growth}</span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="hidden max-w-[120px] truncate text-xs lg:table-cell">
                {l.top_neighborhood ?? "—"}
                {l.top_neighborhood_concentration_pct != null && (
                  <span className="text-muted-foreground"> ({l.top_neighborhood_concentration_pct}%)</span>
                )}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <LeadershipVoteProgress
                  pledged={l.pledged_votes}
                  target={l.estimated_votes}
                  size="sm"
                />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-0.5">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
