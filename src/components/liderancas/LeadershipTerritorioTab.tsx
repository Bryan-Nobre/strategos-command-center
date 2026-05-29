import { useLeadershipOperationalDetail } from "@/hooks/use-leadership-operational-detail";
import { LoadingState } from "@/components/common/LoadingState";
import { LEADERSHIP_NETWORK_PAGE_SIZE } from "@/lib/leadership-network";

export function LeadershipTerritorioTab({
  tenantId,
  leadershipId,
  leadership,
}: {
  tenantId: string;
  leadershipId: string;
  leadership: {
    top_neighborhood: string | null;
    top_neighborhood_concentration_pct: number | null;
    linked_supporters: number;
    leadership_region: string | null;
  };
}) {
  const { data, isLoading } = useLeadershipOperationalDetail(
    tenantId,
    leadershipId,
    { segment: "all", search: "", limit: LEADERSHIP_NETWORK_PAGE_SIZE, offset: 0 },
    true,
  );

  if (isLoading) {
    return <LoadingState label="Carregando território…" />;
  }

  const territory = data?.territory ?? [];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Distribuição dos apoiadores vinculados por bairro (texto declarado no cadastro). Sem mapa ou
        geocodificação.
      </p>

      {leadership.leadership_region && (
        <p className="text-sm">
          <span className="text-muted-foreground">Região cadastrada da liderança: </span>
          <span className="font-medium">{leadership.leadership_region}</span>
        </p>
      )}

      {leadership.top_neighborhood && (
        <div className="rounded-lg border bg-primary/5 px-3 py-2 text-sm">
          Bairro dominante: <strong>{leadership.top_neighborhood}</strong>
          {leadership.top_neighborhood_concentration_pct != null && (
            <span className="text-muted-foreground">
              {" "}
              ({leadership.top_neighborhood_concentration_pct}% da rede)
            </span>
          )}
        </div>
      )}

      {territory.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum bairro informado nos apoiadores vinculados.</p>
      ) : (
        <ul className="space-y-3">
          {territory.map((t) => (
            <li key={t.neighborhood}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{t.neighborhood}</span>
                <span className="tabular-nums text-muted-foreground">
                  {t.count} · {t.pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${Math.min(100, t.pct)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-muted-foreground">
        Total na rede: {leadership.linked_supporters} apoiador(es) com vínculo ativo.
      </p>
    </div>
  );
}
