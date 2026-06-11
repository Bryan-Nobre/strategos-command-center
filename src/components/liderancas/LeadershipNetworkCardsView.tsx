import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import {
  LeadershipLinkSourceBadge,
  LeadershipPrimaryBadge,
  LeadershipRelationshipBadge,
} from "@/components/liderancas/LeadershipPoliticalBadges";
import { LeadershipNetworkSupporterActions } from "@/components/liderancas/LeadershipNetworkSupporterActions";
import { SupporterEngagementBadge } from "@/components/supporters/SupporterEngagementBadge";
import { SupporterGeoBadge } from "@/components/supporters/SupporterGeoBadge";
import type { LeadershipNetworkSupporterRow } from "@/lib/leadership-network";

export function LeadershipNetworkCardsView({
  rows,
  leadershipId,
}: {
  rows: LeadershipNetworkSupporterRow[];
  leadershipId: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum apoiador neste filtro.
      </p>
    );
  }

  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2">
      {rows.map((row) => (
        <Card key={row.supporter_id} className="shadow-sm">
          <CardContent className="space-y-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold leading-tight">{row.supporter_name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Entrada {format(new Date(row.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  {row.neighborhood ? ` · ${row.neighborhood}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              <LeadershipPrimaryBadge isPrimary={row.is_primary} />
              <LeadershipRelationshipBadge type={row.relationship_type} />
              <LeadershipLinkSourceBadge source={row.source} />
              <SupporterEngagementBadge status={row.engagement_status} />
              <SupporterGeoBadge
                cep={row.cep}
                geo_pending={row.geo_pending}
                geo_enrichment_failed={row.geo_enrichment_failed}
                geo_enriched_at={row.geo_enriched_at}
              />
            </div>

            {(row.chapa_names ?? []).length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Chapas: </span>
                {row.chapa_names.join(", ")}
              </p>
            )}

            <LeadershipNetworkSupporterActions
              row={row}
              leadershipId={leadershipId}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
