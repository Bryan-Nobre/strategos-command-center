import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadershipVoteProgress } from "@/components/liderancas/LeadershipVoteProgress";
import type { LeadershipListItem } from "@/components/liderancas/LeadershipDetailSheet";
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
            <TableHead>Liderança</TableHead>
            <TableHead>Região</TableHead>
            <TableHead>Meta / apoios landing</TableHead>
            <TableHead>Apoiadores</TableHead>
            <TableHead>Chapas</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((l) => (
            <TableRow
              key={l.id}
              ref={l.id === highlightId ? highlightRef : undefined}
              className={cn(
                "cursor-pointer hover:bg-muted/40",
                l.id === highlightId && DEEP_LINK_HIGHLIGHT_CLASS,
              )}
              onClick={() => onOpen(l)}
            >
              <TableCell className="font-medium">{l.name}</TableCell>
              <TableCell className="text-muted-foreground">{l.region ?? "—"}</TableCell>
              <TableCell className="min-w-[180px]">
                <LeadershipVoteProgress pledged={l.pledged_votes} target={l.estimated_votes} size="sm" />
              </TableCell>
              <TableCell className="tabular-nums">{l.apoiadores}</TableCell>
              <TableCell className="tabular-nums">{l.chapa_count}</TableCell>
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
