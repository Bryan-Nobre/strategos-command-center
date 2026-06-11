import { useMemo, useState } from "react";

import { format } from "date-fns";

import { ptBR } from "date-fns/locale";

import { Clock, LayoutGrid, LayoutList, Search } from "lucide-react";

import { ListPagination } from "@/components/common/ListPagination";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {

  Table,

  TableBody,

  TableCell,

  TableHead,

  TableHeader,

  TableRow,

} from "@/components/ui/table";

import { LoadingState } from "@/components/common/LoadingState";

import { LeadershipNetworkCardsView } from "@/components/liderancas/LeadershipNetworkCardsView";

import { LeadershipNetworkSummary } from "@/components/liderancas/LeadershipNetworkSummary";

import { LeadershipNetworkSupporterActions } from "@/components/liderancas/LeadershipNetworkSupporterActions";

import {

  LeadershipLinkSourceBadge,

  LeadershipPrimaryBadge,

  LeadershipRelationshipBadge,

  LeadershipWeightBadge,

} from "@/components/liderancas/LeadershipPoliticalBadges";

import { SupporterEngagementBadge } from "@/components/supporters/SupporterEngagementBadge";

import { SupporterGeoBadge } from "@/components/supporters/SupporterGeoBadge";

import { useLeadershipOperationalDetail } from "@/hooks/use-leadership-operational-detail";

import { leadershipNetworkSegmentLabel } from "@/lib/leadership-metrics-copy";

import {

  LEADERSHIP_NETWORK_PAGE_SIZE,

  LEADERSHIP_NETWORK_SEGMENTS,

  type LeadershipNetworkSegmentId,

  type LeadershipNetworkViewMode,

} from "@/lib/leadership-network";

import { cn } from "@/lib/utils";



export function LeadershipNetworkTab({

  tenantId,

  leadershipId,

  leadershipName,

  totalPoints,

}: {

  tenantId: string;

  leadershipId: string;

  leadershipName: string;

  totalPoints: number;

}) {

  const [segment, setSegment] = useState<LeadershipNetworkSegmentId>("all");

  const [viewMode, setViewMode] = useState<LeadershipNetworkViewMode>("blocks");

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

  const supporters = data?.supporters ?? [];

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

        <LeadershipNetworkSummary summary={summary} totalPoints={totalPoints} />

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



      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex flex-wrap gap-1.5">

          {LEADERSHIP_NETWORK_SEGMENTS.map((s) => (

            <Button

              key={s.id}

              type="button"

              size="sm"

              variant={segment === s.id ? "default" : "outline"}

              className="h-8 rounded-full px-3 text-xs"

              onClick={() => changeSegment(s.id)}

            >

              {s.label}

            </Button>

          ))}

        </div>

        <ToggleGroup

          type="single"

          value={viewMode}

          onValueChange={(v) => v && setViewMode(v as LeadershipNetworkViewMode)}

          className="justify-end"

        >

          <ToggleGroupItem value="blocks" className="gap-1.5 px-3 text-xs" aria-label="Blocos">

            <LayoutGrid className="h-4 w-4" />

            Blocos

          </ToggleGroupItem>

          <ToggleGroupItem value="table" className="gap-1.5 px-3 text-xs" aria-label="Lista">

            <LayoutList className="h-4 w-4" />

            Lista

          </ToggleGroupItem>

        </ToggleGroup>

      </div>



      <div className="flex gap-2">

        <div className="relative min-w-0 flex-1">

          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

          <Input

            placeholder="Buscar apoiador, bairro ou cidade…"

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

        <LoadingState label="Carregando apoiadores…" />

      ) : (

        <>

          <div

            className={cn(

              "rounded-lg border",

              viewMode === "table" && "overflow-x-auto",

              isFetching && "opacity-60",

            )}

          >

            {viewMode === "blocks" ? (

              <LeadershipNetworkCardsView rows={supporters} leadershipId={leadershipId} />

            ) : supporters.length === 0 ? (

              <p className="py-8 text-center text-sm text-muted-foreground">

                Nenhum apoiador neste filtro.

              </p>

            ) : (

              <Table>

                <TableHeader>

                  <TableRow className="bg-muted/40">

                    <TableHead>Nome</TableHead>

                    <TableHead className="hidden sm:table-cell">Temp.</TableHead>

                    <TableHead>Tipo</TableHead>

                    <TableHead className="min-w-[5.5rem]">Pontos</TableHead>

                    <TableHead className="hidden sm:table-cell">Origem</TableHead>

                    <TableHead className="hidden md:table-cell">Bairro</TableHead>

                    <TableHead className="hidden lg:table-cell">Chapas</TableHead>

                    <TableHead className="hidden sm:table-cell">Entrada</TableHead>

                    <TableHead className="w-24" />

                  </TableRow>

                </TableHeader>

                <TableBody>

                  {supporters.map((row) => (

                    <TableRow key={row.supporter_id}>

                      <TableCell>

                        <div className="font-medium">{row.supporter_name}</div>

                        <div className="mt-1 flex flex-wrap gap-1">

                          <LeadershipPrimaryBadge isPrimary={row.is_primary} />

                          <SupporterGeoBadge

                            cep={row.cep}

                            geo_pending={row.geo_pending}

                            geo_enrichment_failed={row.geo_enrichment_failed}

                            geo_enriched_at={row.geo_enriched_at}

                          />

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

                        {(row.chapa_names ?? []).length ? row.chapa_names.join(", ") : "—"}

                      </TableCell>

                      <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground sm:table-cell">

                        {format(new Date(row.created_at), "dd/MM/yy", { locale: ptBR })}

                      </TableCell>

                      <TableCell>

                        <LeadershipNetworkSupporterActions

                          row={row}

                          leadershipId={leadershipId}

                          compact

                        />

                      </TableCell>

                    </TableRow>

                  ))}

                </TableBody>

              </Table>

            )}

          </div>



          {filteredTotal > LEADERSHIP_NETWORK_PAGE_SIZE && (

            <ListPagination

              className="border-none px-0"

              page={currentPage}

              totalPages={pageCount}

              totalItems={filteredTotal}

              pageSize={LEADERSHIP_NETWORK_PAGE_SIZE}

              itemLabel="apoiadores"

              onPageChange={(nextPage) =>

                setOffset((nextPage - 1) * LEADERSHIP_NETWORK_PAGE_SIZE)

              }

            />

          )}



          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">

            <Clock className="h-3 w-3" aria-hidden />

            Rede de {leadershipName} · filtro: {leadershipNetworkSegmentLabel(segment)} ·{" "}

            {LEADERSHIP_NETWORK_PAGE_SIZE} por página

          </p>

        </>

      )}

    </div>

  );

}


