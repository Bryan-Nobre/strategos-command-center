import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, ExternalLink, History, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState } from "@/components/common/LoadingState";
import {
  LeadershipLinkSourceBadge,
  LeadershipPrimaryBadge,
  LeadershipRelationshipBadge,
  LeadershipWeightBadge,
} from "@/components/liderancas/LeadershipPoliticalBadges";
import { SupporterEngagementBadge } from "@/components/supporters/SupporterEngagementBadge";
import { useLeadershipOperationalDetail } from "@/hooks/use-leadership-operational-detail";
import {
  LEADERSHIP_NETWORK_PAGE_SIZE,
  LEADERSHIP_NETWORK_SEGMENTS,
  type LeadershipNetworkSegmentId,
} from "@/lib/leadership-network";
import { cn } from "@/lib/utils";

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-[72px] shrink-0 rounded-md border bg-muted/25 px-2.5 py-2 text-center">
      <p className="text-base font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

export function LeadershipNetworkTab({
  tenantId,
  leadershipId,
  leadershipName,
}: {
  tenantId: string;
  leadershipId: string;
  leadershipName: string;
}) {
  const [segment, setSegment] = useState<LeadershipNetworkSegmentId>("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [offset, setOffset] = useState(0);

  const queryParams = useMemo(
    () => ({
      segment,
      search: searchDebounced,
      limit: LEADERSHIP_NETWORK_PAGE_SIZE,
      offset,
    }),
    [segment, searchDebounced, offset],
  );

  const { data, isLoading, isFetching } = useLeadershipOperationalDetail(
    tenantId,
    leadershipId,
    queryParams,
    true,
  );

  const summary = data?.summary;
  const filteredTotal = summary?.filtered_total ?? 0;
  const pageCount = Math.max(1, Math.ceil(filteredTotal / LEADERSHIP_NETWORK_PAGE_SIZE));
  const currentPage = Math.floor(offset / LEADERSHIP_NETWORK_PAGE_SIZE) + 1;

  function applySearch() {
    setSearchDebounced(search.trim());
    setOffset(0);
  }

  function changeSegment(next: LeadershipNetworkSegmentId) {
    setSegment(next);
    setOffset(0);
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <KpiCard label="Na rede" value={summary.total_in_network} />
          <KpiCard label="Primários" value={summary.primary_count} />
          <KpiCard label="Secundários" value={summary.secondary_count} />
          <KpiCard label="Com pledge" value={summary.with_pledge_count} />
          <KpiCard label="Só CRM" value={summary.crm_only_count} />
          <KpiCard label="+7 dias" value={summary.weekly_growth} />
          <KpiCard label="Ativos 30d" value={summary.active_supporters_30d ?? 0} />
          <KpiCard label="Quentes" value={summary.hot_supporters ?? 0} />
          <KpiCard label="Score médio" value={summary.avg_activity_score ?? 0} />
        </div>
      )}

      {(data?.territory?.length ?? 0) > 0 && (
        <div className="rounded-lg border bg-muted/15 px-3 py-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Território (top 5)
          </p>
          <div className="space-y-1.5">
            {data!.territory.map((t) => (
              <div key={t.neighborhood} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate">{t.neighborhood}</span>
                <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${Math.min(100, t.pct)}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                  {t.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {LEADERSHIP_NETWORK_SEGMENTS.map((s) => (
          <Button
            key={s.id}
            type="button"
            size="sm"
            variant={segment === s.id ? "default" : "outline"}
            className="h-7 rounded-full px-2.5 text-[10px]"
            onClick={() => changeSegment(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar na rede…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Button type="button" size="sm" variant="secondary" className="h-8" onClick={applySearch}>
          Buscar
        </Button>
      </div>

      {isLoading ? (
        <LoadingState label="Carregando rede…" />
      ) : (
        <>
          <div className={cn("overflow-x-auto rounded-lg border", isFetching && "opacity-60")}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Temp.</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-12">Peso</TableHead>
                  <TableHead className="hidden sm:table-cell">Origem</TableHead>
                  <TableHead className="hidden md:table-cell">Bairro</TableHead>
                  <TableHead className="hidden lg:table-cell">Chapas</TableHead>
                  <TableHead className="hidden sm:table-cell">Entrada</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.supporters ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum apoiador neste segmento.
                    </TableCell>
                  </TableRow>
                ) : (
                  (data?.supporters ?? []).map((row) => (
                    <TableRow key={row.supporter_id}>
                      <TableCell>
                        <div className="font-medium">{row.supporter_name}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <LeadershipPrimaryBadge isPrimary={row.is_primary} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <SupporterEngagementBadge status={row.engagement_status} />
                      </TableCell>
                      <TableCell>
                        <LeadershipRelationshipBadge type={row.relationship_type} />
                      </TableCell>
                      <TableCell>
                        <LeadershipWeightBadge weight={row.weight} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <LeadershipLinkSourceBadge source={row.source} />
                      </TableCell>
                      <TableCell className="hidden max-w-[100px] truncate text-xs md:table-cell">
                        {row.neighborhood ?? "—"}
                      </TableCell>
                      <TableCell className="hidden max-w-[120px] truncate text-xs text-muted-foreground lg:table-cell">
                        {(row.chapa_names ?? []).length
                          ? row.chapa_names.join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground sm:table-cell">
                        {format(new Date(row.created_at), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Abrir eleitor">
                            <Link to="/eleitores" search={{ id: row.supporter_id }}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          {(row.normalized_neighborhood ?? row.neighborhood) && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Filtrar bairro">
                              <Link
                                to="/eleitores"
                                search={{
                                  lideranca: leadershipId,
                                  bairro: row.normalized_neighborhood ?? row.neighborhood ?? undefined,
                                }}
                              >
                                <MapPin className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled
                            title="Histórico (em breve)"
                          >
                            <History className="h-3.5 w-3.5 opacity-40" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredTotal > LEADERSHIP_NETWORK_PAGE_SIZE && (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {filteredTotal} na rede · página {currentPage} de {pageCount}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={offset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - LEADERSHIP_NETWORK_PAGE_SIZE))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={offset + LEADERSHIP_NETWORK_PAGE_SIZE >= filteredTotal}
                  onClick={() => setOffset((o) => o + LEADERSHIP_NETWORK_PAGE_SIZE)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden />
            Rede de {leadershipName} · dados via servidor (segmento: {segment})
          </p>
        </>
      )}
    </div>
  );
}
