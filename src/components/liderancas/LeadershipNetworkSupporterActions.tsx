import { Link } from "@tanstack/react-router";
import { ExternalLink, History, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeadershipNetworkSupporterRow } from "@/lib/leadership-network";

export function LeadershipNetworkSupporterActions({
  row,
  leadershipId,
  compact,
}: {
  row: LeadershipNetworkSupporterRow;
  leadershipId: string;
  compact?: boolean;
}) {
  const neighborhood = row.normalized_neighborhood ?? row.neighborhood;
  const city = row.city?.trim() || undefined;

  return (
    <div className={compact ? "flex justify-end gap-0.5" : "flex flex-wrap gap-1.5 pt-1"}>
      <Button
        variant={compact ? "ghost" : "outline"}
        size={compact ? "icon" : "sm"}
        className={compact ? "h-7 w-7" : "h-7 gap-1 text-xs"}
        asChild
        title="Ver apoiador marcado na base"
      >
        <Link
          to="/eleitores"
          search={{
            id: row.supporter_id,
            lideranca: leadershipId,
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {!compact && <span>Ver apoiador</span>}
        </Link>
      </Button>
      {(neighborhood || city) && (
        <Button
          variant={compact ? "ghost" : "outline"}
          size={compact ? "icon" : "sm"}
          className={compact ? "h-7 w-7" : "h-7 gap-1 text-xs"}
          asChild
          title="Filtrar por cidade e bairro na base de apoiadores"
        >
          <Link
            to="/eleitores"
            search={{
              lideranca: leadershipId,
              bairro: neighborhood ?? undefined,
              cidade: city,
            }}
          >
            <MapPin className="h-3.5 w-3.5" />
            {!compact && <span>Território</span>}
          </Link>
        </Button>
      )}
      <Button
        variant={compact ? "ghost" : "outline"}
        size={compact ? "icon" : "sm"}
        className={compact ? "h-7 w-7" : "h-7 gap-1 text-xs"}
        disabled
        title="Histórico (em breve)"
      >
        <History className={compact ? "h-3.5 w-3.5 opacity-40" : "h-3.5 w-3.5"} />
        {!compact && <span className="opacity-50">Histórico</span>}
      </Button>
    </div>
  );
}
