import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Calendar, Filter, Search, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTenant } from "@/hooks/use-tenant";
import { useCrudPermissions } from "@/hooks/use-crud-permissions";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import {
  useAgendaEvents,
  useCreateAgendaEvent,
  useUpdateAgendaEvent,
  useDeleteAgendaEvent,
} from "@/hooks/use-agenda";
import { useLeaderships } from "@/hooks/use-leaderships";
import { useSupporters } from "@/hooks/use-supporters";
import { LoadingState } from "@/components/common/LoadingState";
import { AGENDA_EVENT_STATUS_LABELS } from "@/types/domain";
import {
  parseAgendaSearch,
  serializeAgendaSearch,
  agendaSearchToFilterState,
  filterStateToAgendaSearch,
  type AgendaListSearch,
} from "@/lib/list-search/agenda";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import { ListUrlActions } from "@/components/common/ListUrlActions";
import { countActiveFilters } from "@/lib/list-search/utils";
import { filterAgendaEvents } from "@/lib/agenda-filter";
import {
  computeAgendaStats,
  parseIsoDate,
  startOfWeekMonday,
  toIsoDate,
} from "@/lib/agenda-utils";
import { AgendaCompactBar } from "@/components/agenda/AgendaCompactBar";
import { AgendaFilterChips } from "@/components/agenda/AgendaFilterChips";
import { AgendaViewToggle } from "@/components/agenda/AgendaViewToggle";
import { AgendaCalendarPanel } from "@/components/agenda/AgendaCalendarPanel";
import { AgendaEventCard } from "@/components/agenda/AgendaEventCard";
import { AgendaEventFormDialog } from "@/components/agenda/AgendaEventFormDialog";
import { AgendaEventDetailSheet } from "@/components/agenda/AgendaEventDetailSheet";
import { AgendaWeekView } from "@/components/agenda/AgendaWeekView";
import { downloadAgendaExcel } from "@/lib/excel/agenda-export";
import type { AgendaEventWithRelations } from "@/services/agenda";

export const Route = createFileRoute("/_app/agenda")({
  validateSearch: (search: Record<string, unknown>): AgendaListSearch => parseAgendaSearch(search),
  component: AgendaPage,
});

function AgendaPage() {
  const { tenantId } = useTenant();
  const todayIso = toIsoDate(new Date());
  const urlSearch = Route.useSearch();
  const highlightId = urlSearch.id;
  const filters = agendaSearchToFilterState(urlSearch, todayIso);
  const { localText: query, setLocalText: setQuery, setSearch } = useSyncedListSearch({
    search: urlSearch,
    serialize: serializeAgendaSearch,
  });

  const { data: events, isLoading } = useAgendaEvents(tenantId);
  const { data: leaderships } = useLeaderships(tenantId);
  const { data: supporters } = useSupporters(tenantId);
  const createMutation = useCreateAgendaEvent(tenantId);
  const updateMutation = useUpdateAgendaEvent(tenantId);
  const deleteMutation = useDeleteAgendaEvent(tenantId);
  const perms = useCrudPermissions("agenda");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgendaEventWithRelations | null>(null);
  const [detailTarget, setDetailTarget] = useState<AgendaEventWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgendaEventWithRelations | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const selectedDate = useMemo(() => parseIsoDate(filters.data), [filters.data]);
  const leadershipOptions = useMemo(
    () => (leaderships ?? []).map((l) => ({ id: l.id, name: l.name })),
    [leaderships],
  );
  const supporterOptions = useMemo(
    () =>
      (supporters ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        neighborhood: s.neighborhood,
      })),
    [supporters],
  );

  const stats = useMemo(
    () => computeAgendaStats(events ?? [], todayIso),
    [events, todayIso],
  );

  const filtered = useMemo(
    () => filterAgendaEvents(events ?? [], filters, query, highlightId),
    [events, filters, query, highlightId],
  );

  const detailEvent = useMemo(() => {
    if (!detailTarget) return null;
    return events?.find((e) => e.id === detailTarget.id) ?? detailTarget;
  }, [detailTarget, events]);

  useEffect(() => {
    if (highlightId && events?.length) {
      const target = events.find((e) => e.id === highlightId);
      if (target?.event_date && target.event_date !== filters.data) {
        setSearch(filterStateToAgendaSearch({ ...filters, data: target.event_date }, highlightId));
      }
    }
  }, [highlightId, events, filters, setSearch]);

  function patchFilter(patch: Partial<typeof filters>) {
    setSearch(filterStateToAgendaSearch({ ...filters, ...patch }, highlightId));
  }

  function clearFilters() {
    setQuery("");
    setSearch(filterStateToAgendaSearch({ ...filters, busca: "", tipo: "all", status: "all", filtro: "all" }));
  }

  const activeFilterCount = countActiveFilters([
    filters.tipo !== "all",
    filters.status !== "all",
    filters.filtro !== "all",
    !!query.trim(),
  ]);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadAgendaExcel(events ?? []);
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) return <LoadingState />;

  const weekStart = startOfWeekMonday(filters.data);
  const showCalendar = filters.view === "dia" || filters.view === "semana";

  return (
    <ModuleRouteGuard module="agenda">
      <div className="space-y-6">
        <PageHeader
          title="Agenda política"
          description="Reuniões, eventos, caminhadas e visitas — com apoiadores que acompanham."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={exporting || !events?.length}
                onClick={handleExport}
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Exportando..." : "Excel"}
              </Button>
              {perms.canCreate && (
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo evento
                    </Button>
                  </DialogTrigger>
                  <AgendaEventFormDialog
                    title="Agendar evento"
                    loading={createMutation.isPending}
                    defaultDate={filters.data}
                    leaderships={leadershipOptions}
                    onSubmit={(values) => {
                      createMutation.mutate(values, { onSuccess: () => setCreateOpen(false) });
                    }}
                  />
                </Dialog>
              )}
            </>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar evento, local, bairro..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AgendaViewToggle view={filters.view} onChange={(view) => patchFilter({ view })} />
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Status
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>Status do compromisso.</SheetDescription>
                </SheetHeader>
                <div className="mt-6 grid gap-2">
                  <Label>Status do evento</Label>
                  <Select value={filters.status} onValueChange={(v) => patchFilter({ status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(AGENDA_EVENT_STATUS_LABELS).map(([k, l]) => (
                        <SelectItem key={k} value={k}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ListUrlActions onClear={clearFilters} />
                </div>
              </SheetContent>
            </Sheet>
            {(query.trim() || highlightId) && <ListUrlActions onClear={clearFilters} />}
          </div>
        </div>

        {!!events?.length && (
          <>
            <AgendaCompactBar
              hoje={stats.hoje}
              semana={stats.semana}
              proximos7={stats.proximos7}
              comApoiadores={stats.comApoiadores}
            />
            <AgendaFilterChips
              tipo={filters.tipo}
              filtro={filters.filtro}
              onTipoChange={(tipo) => patchFilter({ tipo })}
              onFiltroChange={(filtro) => patchFilter({ filtro })}
            />
          </>
        )}

        {!events?.length ? (
          <EmptyState
            icon={Calendar}
            title="Nenhum evento agendado"
            description="Cadastre reuniões, caminhadas e visitas da campanha."
            actionLabel={perms.canCreate ? "Novo evento" : undefined}
            onAction={perms.canCreate ? () => setCreateOpen(true) : undefined}
          />
        ) : (
          <div className={showCalendar ? "grid gap-6 lg:grid-cols-3" : "space-y-4"}>
            {showCalendar && (
              <AgendaCalendarPanel
                selectedDate={selectedDate}
                events={events}
                onSelectDate={(d) => {
                  if (!d) return;
                  patchFilter({ data: toIsoDate(d) });
                }}
              />
            )}
            <div className={showCalendar ? "space-y-3 lg:col-span-2" : "space-y-3"}>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Nenhum evento com estes filtros"
                  description="Ajuste data, visão ou filtros."
                  actionLabel="Limpar filtros"
                  onAction={clearFilters}
                />
              ) : filters.view === "semana" ? (
                <AgendaWeekView
                  weekStartIso={weekStart}
                  events={filtered}
                  highlightId={highlightId}
                  canUpdate={perms.canUpdate}
                  canDelete={perms.canDelete}
                  onOpen={setDetailTarget}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              ) : (
                filtered.map((ev) => (
                  <AgendaEventCard
                    key={ev.id}
                    event={ev}
                    highlight={ev.id === highlightId}
                    showDate={filters.view === "lista"}
                    canUpdate={perms.canUpdate}
                    canDelete={perms.canDelete}
                    onOpen={() => setDetailTarget(ev)}
                    onEdit={() => setEditTarget(ev)}
                    onDelete={() => setDeleteTarget(ev)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        <AgendaEventDetailSheet
          event={detailEvent}
          tenantId={tenantId}
          supporters={supporterOptions}
          open={!!detailTarget}
          onOpenChange={(o) => !o && setDetailTarget(null)}
          canUpdate={perms.canUpdate}
          onEdit={() => {
            if (detailTarget) {
              setEditTarget(detailTarget);
              setDetailTarget(null);
            }
          }}
        />

        <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
          {editTarget && (
            <AgendaEventFormDialog
              title="Editar evento"
              loading={updateMutation.isPending}
              leaderships={leadershipOptions}
              initial={editTarget}
              onSubmit={(values) => {
                updateMutation.mutate(
                  { id: editTarget.id, ...values },
                  { onSuccess: () => setEditTarget(null) },
                );
              }}
            />
          )}
        </Dialog>

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title="Excluir evento"
          description={`Tem certeza que deseja excluir "${deleteTarget?.title}"?`}
          loading={deleteMutation.isPending}
          onConfirm={() => {
            if (deleteTarget) {
              deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
            }
          }}
        />
      </div>
    </ModuleRouteGuard>
  );
}
