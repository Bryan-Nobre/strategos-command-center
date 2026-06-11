import { format } from "date-fns";
import { Phone, Trash2, UserCheck, Vote } from "lucide-react";
import { formatPhoneBrDisplay, telHref } from "@/lib/normalize-phone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SupporterSourceBadge } from "@/components/supporters/SupporterSourceBadge";
import { SupporterPossibleDuplicateBadge } from "@/components/supporters/SupporterPossibleDuplicateBadge";
import { SupporterEngagementBadge } from "@/components/supporters/SupporterEngagementBadge";
import { SupporterGeoBadge } from "@/components/supporters/SupporterGeoBadge";
import {
  SUPPORT_LEVEL_LABELS,
  SUPPORTER_STATUS_LABELS,
  SUPPORTER_SOURCE_LABELS,
} from "@/types/domain";
import type { SupporterListItem } from "@/lib/eleitores-filter";
import { formatLeadershipSummaryLabel } from "@/components/supporters/SupporterPoliticalLinksPanel";
import { DEEP_LINK_HIGHLIGHT_CLASS } from "@/lib/search-deep-link";
import { cn } from "@/lib/utils";

export function EleitoresCardsView({
  rows,
  highlightId,
  highlightRef,
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
  highlightRef?: React.RefObject<HTMLElement | null>;
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
          ref={e.id === highlightId ? highlightRef : undefined}
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
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate font-semibold text-foreground">{e.name}</h3>
                {e.is_possible_duplicate && <SupporterPossibleDuplicateBadge />}
                <SupporterGeoBadge
                  cep={e.cep}
                  geo_pending={e.geo_pending}
                  geo_enrichment_failed={e.geo_enrichment_failed}
                  geo_enriched_at={e.geo_enriched_at}
                />
              </div>
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
            <SupporterEngagementBadge status={e.engagement_status} />
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

          {e.last_activity_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              Última atividade: {format(new Date(e.last_activity_at), "dd/MM/yyyy HH:mm")}
            </p>
          )}

          {(e.political_link_count ?? 0) > 0 || e.leadership_id ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatLeadershipSummaryLabel(
                e.primary_leadership_name,
                e.political_link_count ?? (e.leadership_id ? 1 : 0),
                e.political_leadership_names ?? [],
              )}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            {telHref(e.phone) && (
              <a
                href={telHref(e.phone)!}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                onClick={(ev) => ev.stopPropagation()}
              >
                <Phone className="h-3.5 w-3.5" />
                {formatPhoneBrDisplay(e.phone)}
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
