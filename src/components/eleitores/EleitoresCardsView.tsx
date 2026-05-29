import { format } from "date-fns";
import { Phone, Trash2, UserCheck, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SupporterSourceBadge } from "@/components/supporters/SupporterSourceBadge";
import {
  SUPPORT_LEVEL_LABELS,
  SUPPORTER_STATUS_LABELS,
  SUPPORTER_SOURCE_LABELS,
} from "@/types/domain";
import type { SupporterListItem } from "@/lib/eleitores-filter";
import { DEEP_LINK_HIGHLIGHT_CLASS } from "@/lib/search-deep-link";
import { cn } from "@/lib/utils";

export function EleitoresCardsView({
  rows,
  highlightId,
  selectedIds,
  onToggleSelect,
  onCardClick,
  onQuickSupport,
  onQuickStatus,
  onDelete,
  landingMode,
  canUpdate,
  canDelete,
}: {
  rows: SupporterListItem[];
  highlightId?: string;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onCardClick: (row: SupporterListItem) => void;
  onQuickSupport: (row: SupporterListItem) => void;
  onQuickStatus: (row: SupporterListItem) => void;
  onDelete: (row: SupporterListItem) => void;
  landingMode?: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((e) => (
        <article
          key={e.id}
          role="button"
          tabIndex={0}
          onClick={() => onCardClick(e)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              onCardClick(e);
            }
          }}
          className={cn(
            "eleitores-card text-left transition-theme",
            landingMode && "eleitores-card--landing",
            e.id === highlightId && DEEP_LINK_HIGHLIGHT_CLASS,
            selectedIds.has(e.id) && "ring-2 ring-primary/40",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-foreground">{e.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {format(new Date(e.created_at), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
            {canDelete && (
              <Checkbox
                checked={selectedIds.has(e.id)}
                onClick={(ev) => ev.stopPropagation()}
                onCheckedChange={() => onToggleSelect(e.id)}
                aria-label={`Selecionar ${e.name}`}
              />
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <SupporterSourceBadge source={e.source} />
            <Badge variant="outline" className="text-[10px]">
              {SUPPORTER_STATUS_LABELS[e.status]}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {SUPPORT_LEVEL_LABELS[e.support_level]}
            </Badge>
          </div>

          {(e.neighborhood || e.city) && (
            <p className="mt-2 text-sm text-foreground">
              {[e.neighborhood, e.city].filter(Boolean).join(" · ")}
            </p>
          )}

          {landingMode && e.interest && (
            <p className="mt-2 rounded-md bg-violet-500/8 px-2 py-1.5 text-xs text-violet-900 dark:text-violet-200">
              <span className="font-semibold">Interesse: </span>
              {e.interest}
            </p>
          )}

          {!landingMode && e.interest && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{e.interest}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            {e.phone && (
              <a
                href={`tel:${e.phone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                onClick={(ev) => ev.stopPropagation()}
              >
                <Phone className="h-3.5 w-3.5" />
                Ligar
              </a>
            )}
            {canUpdate && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onQuickSupport(e);
                  }}
                >
                  <Vote className="mr-1 h-3 w-3" />
                  Apoio forte
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onQuickStatus(e);
                  }}
                >
                  <UserCheck className="mr-1 h-3 w-3" />
                  Apoiador
                </Button>
              </>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs text-destructive"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onDelete(e);
                }}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Excluir
              </Button>
            )}
          </div>

          {landingMode && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Origem: {SUPPORTER_SOURCE_LABELS.landing}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
