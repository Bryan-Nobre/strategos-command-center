import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { PublicLandingChapa } from "@/services/landing";

export type LandingChapaLeadershipGroup = {
  leadershipId: string;
  name: string;
  region: string | null;
  items: PublicLandingChapa[];
};

export function LandingChapasSection({
  groups,
  selectedChapas,
  onToggle,
  embedded = false,
}: {
  groups: LandingChapaLeadershipGroup[];
  selectedChapas: string[];
  onToggle: (id: string) => void;
  /** Quando true, renderiza dentro do formulário de apoio. */
  embedded?: boolean;
}) {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [expandedLeadershipId, setExpandedLeadershipId] = useState<string | null>(null);

  if (!groups.length) return null;

  const totalSelected = selectedChapas.length;

  function toggleLeadership(leadershipId: string) {
    setExpandedLeadershipId((current) => (current === leadershipId ? null : leadershipId));
  }

  function handleSectionOpenChange(open: boolean) {
    setSectionOpen(open);
    if (!open) setExpandedLeadershipId(null);
  }

  const leadersList = (
    <ul className="space-y-1.5">
      {groups.map((group) => {
        const isExpanded = expandedLeadershipId === group.leadershipId;
        const groupSelected = group.items.filter((c) => selectedChapas.includes(c.id)).length;

        return (
          <li
            key={group.leadershipId}
            className="overflow-hidden rounded-lg border border-border/60 bg-background/80"
          >
            <button
              type="button"
              aria-expanded={isExpanded}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
              onClick={() => toggleLeadership(group.leadershipId)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{group.name}</span>
                {group.region && (
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {group.region}
                  </span>
                )}
              </span>
              {groupSelected > 0 && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {groupSelected}
                </span>
              )}
            </button>

            {isExpanded && (
              <div className="space-y-1.5 border-t border-border/50 px-2 pb-2 pt-1.5">
                {group.items.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-muted/30"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={selectedChapas.includes(c.id)}
                      onCheckedChange={() => onToggle(c.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-snug">{c.name}</span>
                      {c.subtitle && (
                        <span className="block text-[11px] leading-relaxed text-muted-foreground">
                          {c.subtitle}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const inner = (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Toque em uma liderança para ver as chapas. Marque quem você apoia antes de confirmar o
        cadastro.
      </p>
      {leadersList}
    </div>
  );

  const summaryLabel = (
    <>
      <span>Quem você apoia na chapa?</span>
      <span className="font-normal text-muted-foreground"> (opcional)</span>
    </>
  );

  if (embedded) {
    return (
      <Collapsible
        open={sectionOpen}
        onOpenChange={handleSectionOpenChange}
        className="landing-chapas-embedded rounded-xl border border-border/70 bg-muted/10"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/20"
          >
            <span className="min-w-0 flex-1">{summaryLabel}</span>
            <span className="flex shrink-0 items-center gap-2">
              {totalSelected > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {totalSelected} selecionado{totalSelected === 1 ? "" : "s"}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  sectionOpen && "rotate-180",
                )}
                aria-hidden
              />
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border/60 px-3 pb-3 pt-2">
          {inner}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Collapsible
      open={sectionOpen}
      onOpenChange={handleSectionOpenChange}
      className="landing-chapas rounded-xl border border-border/70 bg-card/50 shadow-elegant"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/20"
        >
          <span>{summaryLabel}</span>
          <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
            {totalSelected > 0 && (
              <span className="font-medium text-primary">{totalSelected} selecionado(s)</span>
            )}
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", sectionOpen && "rotate-180")}
              aria-hidden
            />
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border/60 px-4 pb-4 pt-3">
        {inner}
      </CollapsibleContent>
    </Collapsible>
  );
}
