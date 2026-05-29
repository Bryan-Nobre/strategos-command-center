import { MoreHorizontal, Pencil, Phone, Trash2, UserCheck, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupporterSourceBadge } from "@/components/supporters/SupporterSourceBadge";
import { SupporterPossibleDuplicateBadge } from "@/components/supporters/SupporterPossibleDuplicateBadge";
import { SupporterEngagementBadge } from "@/components/supporters/SupporterEngagementBadge";
import { SupporterGeoBadge } from "@/components/supporters/SupporterGeoBadge";
import {
  SUPPORT_LEVEL_LABELS,
  SUPPORTER_STATUS_LABELS,
} from "@/types/domain";
import { DEEP_LINK_HIGHLIGHT_CLASS } from "@/lib/search-deep-link";
import type { SupporterListItem } from "@/lib/eleitores-filter";
import { formatLeadershipSummaryLabel } from "@/components/supporters/SupporterPoliticalLinksPanel";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const apoioVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  forte: "default",
  medio: "secondary",
  indeciso: "outline",
  fraco: "destructive",
};

export function EleitoresTableView({
  rows,
  highlightId,
  highlightRef,
  leadershipMap,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  someSelected,
  onRowClick,
  onEdit,
  onDelete,
  onQuickSupport,
  onQuickStatus,
  canUpdate,
  canDelete,
}: {
  rows: SupporterListItem[];
  highlightId?: string;
  highlightRef: React.RefObject<HTMLTableRowElement | null>;
  leadershipMap: Map<string, string>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  someSelected: boolean;
  onRowClick: (row: SupporterListItem) => void;
  onEdit: (row: SupporterListItem) => void;
  onDelete: (row: SupporterListItem) => void;
  onQuickSupport: (row: SupporterListItem) => void;
  onQuickStatus: (row: SupporterListItem) => void;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            {canDelete && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
            )}
            <TableHead>Nome</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Bairro</TableHead>
            <TableHead className="hidden md:table-cell">Liderança</TableHead>
            <TableHead>Apoio</TableHead>
            <TableHead className="hidden md:table-cell">Temp.</TableHead>
            <TableHead className="hidden lg:table-cell">Última ativ.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden xl:table-cell">Cadastro</TableHead>
            <TableHead className="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((e) => (
            <TableRow
              key={e.id}
              ref={e.id === highlightId ? highlightRef : undefined}
              className={cn(
                "cursor-pointer transition-theme hover:bg-muted/40",
                e.id === highlightId && DEEP_LINK_HIGHLIGHT_CLASS,
                selectedIds.has(e.id) && "bg-primary/5",
              )}
              onClick={() => onRowClick(e)}
            >
              {canDelete && (
                <TableCell onClick={(ev) => ev.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(e.id)}
                    onCheckedChange={() => onToggleSelect(e.id)}
                    aria-label={`Selecionar ${e.name}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>{e.name}</span>
                  {e.is_possible_duplicate && <SupporterPossibleDuplicateBadge />}
                  <SupporterGeoBadge
                    cep={e.cep}
                    geo_pending={e.geo_pending}
                    geo_enrichment_failed={e.geo_enrichment_failed}
                    geo_enriched_at={e.geo_enriched_at}
                  />
                </div>
                {e.interest && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{e.interest}</p>
                )}
              </TableCell>
              <TableCell>
                <SupporterSourceBadge source={e.source} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {e.phone ? (
                  <a
                    href={`tel:${e.phone.replace(/\D/g, "")}`}
                    className="inline-flex items-center gap-1 hover:text-primary"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <Phone className="h-3 w-3" />
                    {e.phone}
                  </a>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {e.neighborhood ?? "—"}
                {e.city && <div className="text-xs text-muted-foreground">{e.city}</div>}
              </TableCell>
              <TableCell className="hidden max-w-[140px] truncate text-sm md:table-cell" title={
                (e.political_leadership_names ?? []).join(", ") ||
                (e.leadership_id ? leadershipMap.get(e.leadership_id) : "") ||
                ""
              }>
                {formatLeadershipSummaryLabel(
                  e.primary_leadership_name ??
                    (e.leadership_id ? leadershipMap.get(e.leadership_id) : null),
                  e.political_link_count ?? (e.leadership_id ? 1 : 0),
                  e.political_leadership_names ?? [],
                )}
              </TableCell>
              <TableCell>
                <Badge variant={apoioVariant[e.support_level]}>
                  {SUPPORT_LEVEL_LABELS[e.support_level]}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <SupporterEngagementBadge status={e.engagement_status} />
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                {e.last_activity_at
                  ? format(new Date(e.last_activity_at), "dd/MM/yy", { locale: ptBR })
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{SUPPORTER_STATUS_LABELS[e.status] ?? e.status}</Badge>
              </TableCell>
              <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                {format(new Date(e.created_at), "dd/MM/yy")}
              </TableCell>
              <TableCell onClick={(ev) => ev.stopPropagation()}>
                <div className="flex items-center justify-end gap-0.5">
                  {canUpdate && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Marcar apoio forte"
                        onClick={() => onQuickSupport(e)}
                      >
                        <Vote className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Marcar como apoiador"
                        onClick={() => onQuickStatus(e)}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => onEdit(e)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(e)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
