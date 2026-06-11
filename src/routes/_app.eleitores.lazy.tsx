import { createLazyFileRoute, getRouteApi } from "@tanstack/react-router";
import { RoutePendingFallback } from "@/components/common/RoutePendingFallback";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Download,
  Upload,
  Users,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ListCountFooter } from "@/components/common/ListCountFooter";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/hooks/use-tenant";
import {
  useSupporters,
  useCreateSupporter,
  useUpdateSupporter,
  useDeleteSupporter,
  useImportSupporters,
} from "@/hooks/use-supporters";
import { useLeaderships } from "@/hooks/use-leaderships";
import { useSupporterPoliticalSummaries } from "@/hooks/use-supporter-political";
import { usePlanGate } from "@/hooks/use-plan-gate";
import { useCrudPermissions } from "@/hooks/use-crud-permissions";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import { PlanLimitNotice } from "@/components/common/PlanLimitNotice";
import { LoadingState } from "@/components/common/LoadingState";
import {
  SupporterFormFields,
  supporterFormToPayload,
} from "@/components/supporters/SupporterFormFields";
import { EleitoresCompactBar } from "@/components/eleitores/EleitoresCompactBar";
import { EleitoresToolbar } from "@/components/eleitores/EleitoresToolbar";
import { EleitoresTableView } from "@/components/eleitores/EleitoresTableView";
import { EleitoresCardsView } from "@/components/eleitores/EleitoresCardsView";
import { EleitoresEditSheet } from "@/components/eleitores/EleitoresEditSheet";
import { ListPagination } from "@/components/common/ListPagination";
import {
  listSearchFingerprint,
  listTotalPages,
  pageForItemIndex,
  paginateSlice,
} from "@/lib/list-pagination";

const ELEITORES_PAGE_SIZE = 10;
import {
  SUPPORT_LEVEL_LABELS,
  SUPPORTER_STATUS_LABELS,
  SUPPORTER_SOURCE_LABELS,
  type SupporterFormValues,
} from "@/types/domain";
import { downloadCsv, buildCsvFilename } from "@/lib/csv/download";
import {
  supportersToCsv,
  parseSupportersCsv,
  getSupporterImportTemplateCsv,
} from "@/lib/csv/supporters-csv";
import { ELEITORES_ENGAGEMENT_FILTER_LABELS } from "@/lib/supporter-engagement";
import { buildExcelFilename, downloadSupportersExcel } from "@/lib/excel/supporters-export";
import { filterSupporters, countNewInPeriod, type SupporterListItem } from "@/lib/eleitores-filter";
import { toast } from "sonner";
import {
  eleitoresSearchToFilterState,
  filterStateToEleitoresSearch,
  serializeEleitoresSearch,
  type EleitoresListSearch,
} from "@/lib/list-search/eleitores";
import { countActiveFilters } from "@/lib/list-search/utils";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import { ListUrlActions } from "@/components/common/ListUrlActions";

const eleitoresRoute = getRouteApi("/_app/eleitores");

export const Route = createLazyFileRoute("/_app/eleitores")({
  component: EleitoresPage,
  pendingComponent: RoutePendingFallback,
});

type SupporterRow = SupporterListItem;

function EleitoresPage() {
  const { tenantId, activeTenant } = useTenant();
  const urlSearch = eleitoresRoute.useSearch();
  const highlightId = urlSearch.id;
  const filters = eleitoresSearchToFilterState(urlSearch);
  const { localText: query, setLocalText: setQuery, setSearch } = useSyncedListSearch({
    search: urlSearch,
    serialize: serializeEleitoresSearch,
  });

  const highlightTableRef = useRef<HTMLTableRowElement>(null);
  const highlightCardRef = useRef<HTMLElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SupporterRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupporterRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (
      urlSearch.bairro ||
      urlSearch.cidade ||
      urlSearch.status ||
      urlSearch.lideranca ||
      urlSearch.apoio ||
      urlSearch.tag ||
      urlSearch.engagement
    ) {
      setFiltersOpen(true);
    }
  }, [
    urlSearch.bairro,
    urlSearch.cidade,
    urlSearch.status,
    urlSearch.lideranca,
    urlSearch.apoio,
    urlSearch.tag,
    urlSearch.engagement,
  ]);

  const { data: supporters, isLoading } = useSupporters(tenantId);
  const { data: politicalSummaries } = useSupporterPoliticalSummaries(tenantId);
  const { data: leaderships } = useLeaderships(tenantId);
  const createMutation = useCreateSupporter(tenantId);
  const updateMutation = useUpdateSupporter(tenantId);
  const deleteMutation = useDeleteSupporter(tenantId);
  const importMutation = useImportSupporters(tenantId);
  const planGate = usePlanGate(tenantId);
  const perms = useCrudPermissions("supporters");

  const leadershipMap = useMemo(
    () => new Map((leaderships ?? []).map((l) => [l.id, l.name])),
    [leaderships],
  );

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    for (const s of supporters ?? []) {
      const n = s.normalized_neighborhood ?? s.neighborhood;
      if (n) set.add(n);
    }
    return [...set].sort();
  }, [supporters]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const s of supporters ?? []) {
      const c = s.normalized_city ?? s.city;
      if (c) set.add(c);
    }
    return [...set].sort();
  }, [supporters]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const s of supporters ?? []) {
      for (const t of s.tags ?? []) set.add(t);
    }
    return [...set].sort();
  }, [supporters]);

  const supportersEnriched = useMemo(() => {
    return (supporters ?? []).map((s) => {
      const summary = politicalSummaries?.get(s.id);
      return {
        ...s,
        political_link_count: summary?.link_count ?? 0,
        political_leadership_ids: summary?.leadership_ids ?? [],
        political_leadership_names: summary?.leadership_names ?? [],
        primary_leadership_name: summary?.primary_leadership_name ?? null,
      } satisfies SupporterRow;
    });
  }, [supporters, politicalSummaries]);

  const filtered = useMemo(
    () => filterSupporters(supportersEnriched, filters, query),
    [supportersEnriched, filters, query],
  );

  const totalPages = listTotalPages(filtered.length, ELEITORES_PAGE_SIZE);

  const paginated = useMemo(
    () => paginateSlice(filtered, page, ELEITORES_PAGE_SIZE),
    [filtered, page],
  );

  const filterFingerprint = useMemo(
    () => listSearchFingerprint(serializeEleitoresSearch(urlSearch)),
    [urlSearch],
  );

  useEffect(() => {
    setPage(1);
  }, [filterFingerprint, query]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const landingCount = useMemo(
    () => (supporters ?? []).filter((s) => s.source === "landing").length,
    [supporters],
  );

  const new7d = useMemo(
    () => countNewInPeriod((supporters ?? []) as SupporterRow[], 7),
    [supporters],
  );

  const viewMode = filters.view === "landing" ? "cards" : filters.view;

  useEffect(() => {
    if (!highlightId || filtered.length === 0) return;
    const index = filtered.findIndex((s) => s.id === highlightId);
    if (index < 0) return;
    const targetPage = pageForItemIndex(index, ELEITORES_PAGE_SIZE);
    setPage((current) => (current === targetPage ? current : targetPage));
  }, [highlightId, filtered]);

  useEffect(() => {
    if (!highlightId) return;
    const ref = viewMode === "table" ? highlightTableRef : highlightCardRef;
    const timer = window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [highlightId, page, paginated, viewMode]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => filtered.some((r) => r.id === id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const activeFilterCount = countActiveFilters([
    filters.status !== "all",
    filters.bairro !== "all",
    filters.cidade !== "all",
    filters.lideranca !== "all",
    filters.apoio !== "all",
    !!filters.tag,
    filters.origem !== "all",
    filters.period !== "all",
    filters.engagement !== "all",
    !!query.trim(),
  ]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));
  const someSelected = filtered.some((r) => selectedIds.has(r.id));

  function patchFilter(patch: Partial<typeof filters>) {
    const next = { ...filters, ...patch };
    setSearch(filterStateToEleitoresSearch(next, highlightId));
  }

  function clearFilters() {
    setQuery("");
    setSearch(
      filterStateToEleitoresSearch({
        busca: "",
        status: "all",
        bairro: "all",
        cidade: "all",
        lideranca: "all",
        apoio: "all",
        tag: "",
        origem: "all",
        view: "table",
        period: "all",
        from: "",
        to: "",
        engagement: "all",
      }),
    );
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  }

  async function handleExportExcel() {
    if (!planGate.canExport) {
      toast.error("Exportação não disponível no seu plano atual.");
      return;
    }
    setExporting(true);
    try {
      const slug = activeTenant?.slug ?? "campanha";
      await downloadSupportersExcel({
        filename: buildExcelFilename(slug, "apoiadores"),
        rows: filtered,
        leadershipNames: leadershipMap,
      });
      toast.success(`${filtered.length} apoiador(es) exportado(s) em Excel`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar Excel");
    } finally {
      setExporting(false);
    }
  }

  function handleExportCsv() {
    if (!planGate.canExport) {
      toast.error("Exportação não disponível no seu plano atual.");
      return;
    }
    const slug = activeTenant?.slug ?? "campanha";
    const csv = supportersToCsv(
      filtered.map((r) => {
        const allNames = r.political_leadership_names ?? [];
        const primary =
          r.primary_leadership_name ??
          (r.leadership_id ? leadershipMap.get(r.leadership_id) : null);
        return {
          ...r,
          status: SUPPORTER_STATUS_LABELS[r.status] ?? r.status,
          support_level: SUPPORT_LEVEL_LABELS[r.support_level] ?? r.support_level,
          source: SUPPORTER_SOURCE_LABELS[r.source] ?? r.source,
          primary_leadership_label: primary,
          all_leaderships_label: allNames.length ? allNames.join("; ") : primary,
          leadership_link_count: r.political_link_count ?? (r.leadership_id ? 1 : 0),
        };
      }),
    );
    downloadCsv(buildCsvFilename(slug, "apoiadores"), csv);
    toast.success(`${filtered.length} apoiador(es) exportado(s) em CSV`);
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { rows, errors } = parseSupportersCsv(text);
      if (errors.length) {
        errors.slice(0, 3).forEach((e) => toast.warning(e));
      }
      if (!rows.length) {
        toast.error("Nenhuma linha válida para importar.");
        return;
      }
      const parsed = rows.map((r) => ({
        ...r,
        support_level: r.support_level ?? undefined,
      }));
      const { rows: toImport, skipped } = planGate.sliceImportRows(parsed);
      if (!toImport.length) {
        toast.error("Limite de apoiadores do plano atingido. Nenhuma linha importada.");
        return;
      }
      importMutation.mutate({ rows: toImport, skipped });
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleDownloadTemplate() {
    const slug = activeTenant?.slug ?? "campanha";
    downloadCsv(buildCsvFilename(slug, "modelo-importacao"), getSupporterImportTemplateCsv());
  }

  const handleQuickSupport = useCallback(
    (row: SupporterRow) => {
      updateMutation.mutate({ id: row.id, support_level: "forte" });
    },
    [updateMutation],
  );

  const handleQuickStatus = useCallback(
    (row: SupporterRow) => {
      updateMutation.mutate({ id: row.id, status: "apoiador" });
    },
    [updateMutation],
  );

  function buildDeleteDescription(target: SupporterRow | null, count?: number) {
    if (count && count > 1) {
      return `Tem certeza que deseja excluir ${count} apoiadores selecionados? Esta ação não pode ser desfeita.`;
    }
    if (!target) return "";
    const origem = SUPPORTER_SOURCE_LABELS[target.source] ?? target.source;
    const data = new Date(target.created_at).toLocaleDateString("pt-BR");
    let msg = `Excluir "${target.name}"? Cadastro via ${origem} em ${data}.`;
    msg += " Esta ação não pode ser desfeita.";
    return msg;
  }

  async function confirmBulkDelete() {
    const ids = [...selectedIds];
    try {
      for (const id of ids) {
        await deleteMutation.mutateAsync(id);
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      toast.success(`${ids.length} apoiador(es) removido(s)`);
    } catch {
      /* toast no hook */
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <ModuleRouteGuard module="supporters">
      <div className="eleitores-page space-y-6">
        <PageHeader
          title="Eleitores"
          description={
            planGate.supporterUsageLabel()
              ? `Base de apoiadores · ${planGate.supporterUsageLabel()}`
              : "Gerencie apoiadores, leads da landing e importações."
          }
          actions={
            <>
              <div className="page-header-action-slot">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!planGate.canExport || !perms.canExport || exporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void handleExportExcel()}>
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-primary" />
                    Excel formatado (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCsv}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV simples
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
              <div className="page-header-action-slot">
              <Button
                variant="outline"
                size="sm"
                onClick={() => importRef.current?.click()}
                disabled={!planGate.canAddSupporters() || !perms.canImport}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
              </div>
              <div className="page-header-action-slot">
              <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
                Modelo CSV
              </Button>
              </div>
              <input
                ref={importRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(file);
                  e.target.value = "";
                }}
              />
              <div className="page-header-action-slot">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!planGate.canAddSupporters() || !perms.canCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo eleitor
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Cadastrar novo eleitor</DialogTitle>
                    <DialogDescription>
                      Dados salvos no CRM com isolamento por campanha.
                    </DialogDescription>
                  </DialogHeader>
                  <SupporterFormFields
                    leaderships={(leaderships ?? []).map((l) => ({ id: l.id, name: l.name }))}
                    loading={createMutation.isPending}
                    submitLabel="Salvar eleitor"
                    onSubmit={(v) => {
                      createMutation.mutate(
                        { ...supporterFormToPayload(v), source: "manual" },
                        { onSuccess: () => setCreateOpen(false) },
                      );
                    }}
                  />
                </DialogContent>
              </Dialog>
              </div>
            </>
          }
        />

        {!planGate.canAddSupporters() && (
          <PlanLimitNotice message="Limite de apoiadores do plano atingido. Novos cadastros e importações estão bloqueados até upgrade ou redução da base." />
        )}

        <EleitoresCompactBar
          total={supporters?.length ?? 0}
          filtered={filtered.length}
          new7d={new7d}
          landingCount={landingCount}
        />

        <Card className="shadow-elegant overflow-hidden">
          <CardContent className="p-0">
            <EleitoresToolbar
              query={query}
              onQueryChange={setQuery}
              filters={filters}
              onPatchFilter={patchFilter}
              activeFilterCount={activeFilterCount}
              onOpenFilters={() => setFiltersOpen(true)}
              selectedCount={selectedIds.size}
              onBulkDelete={() => setBulkDeleteOpen(true)}
              canDelete={perms.canDelete}
            />

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros avançados</SheetTitle>
                  <SheetDescription>Status, cidade, bairro, liderança, apoio e tags.</SheetDescription>
                </SheetHeader>
                <div className="eleitores-filters-grid mt-6 grid gap-3">
                  <div className="grid gap-2">
                    <Label>Status político</Label>
                    <Select value={filters.status} onValueChange={(v) => patchFilter({ status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(SUPPORTER_STATUS_LABELS).map(([k, l]) => (
                          <SelectItem key={k} value={k}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Cidade</Label>
                    <Select value={filters.cidade} onValueChange={(v) => patchFilter({ cidade: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {filters.cidade !== "all" &&
                          !cities.includes(filters.cidade) && (
                            <SelectItem value={filters.cidade}>{filters.cidade}</SelectItem>
                          )}
                        {cities.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Bairro</Label>
                    <Select value={filters.bairro} onValueChange={(v) => patchFilter({ bairro: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {filters.bairro !== "all" &&
                          !neighborhoods.includes(filters.bairro) && (
                            <SelectItem value={filters.bairro}>{filters.bairro}</SelectItem>
                          )}
                        {neighborhoods.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Liderança</Label>
                    <Select
                      value={filters.lideranca}
                      onValueChange={(v) => patchFilter({ lideranca: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="none">Sem liderança</SelectItem>
                        {(leaderships ?? []).map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Temperatura / atividade</Label>
                    <Select
                      value={filters.engagement}
                      onValueChange={(v) => patchFilter({ engagement: v as typeof filters.engagement })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(ELEITORES_ENGAGEMENT_FILTER_LABELS) as [
                            keyof typeof ELEITORES_ENGAGEMENT_FILTER_LABELS,
                            string,
                          ][]
                        ).map(([k, l]) => (
                          <SelectItem key={k} value={k}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Grau de apoio</Label>
                    <Select value={filters.apoio} onValueChange={(v) => patchFilter({ apoio: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(SUPPORT_LEVEL_LABELS).map(([k, l]) => (
                          <SelectItem key={k} value={k}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tag</Label>
                    <Select
                      value={filters.tag || "all"}
                      onValueChange={(v) => patchFilter({ tag: v === "all" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Qualquer tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Qualquer</SelectItem>
                        {allTags.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                  <ListUrlActions onClear={clearFilters} showClear={false} />
                </div>
              </SheetContent>
            </Sheet>

            {!filtered.length ? (
              <EmptyState
                icon={Users}
                title={
                  filters.view === "landing"
                    ? "Nenhum lead da landing"
                    : "Nenhum apoiador encontrado"
                }
                description={
                  supporters?.length
                    ? "Ajuste os filtros ou a busca."
                    : "Cadastre apoiadores, use a landing pública ou importe um CSV."
                }
                actionLabel={!supporters?.length ? "Novo eleitor" : undefined}
                onAction={!supporters?.length ? () => setCreateOpen(true) : undefined}
                linkLabel={!supporters?.length ? "Configurar landing" : undefined}
                linkTo={!supporters?.length ? "/configuracoes" : undefined}
                linkSearch={!supporters?.length ? { tab: "landing" } : undefined}
              />
            ) : viewMode === "table" ? (
              <EleitoresTableView
                rows={paginated}
                highlightId={highlightId}
                highlightRef={highlightTableRef}
                leadershipMap={leadershipMap}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                allSelected={allSelected}
                someSelected={someSelected}
                onRowClick={setEditTarget}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onQuickSupport={handleQuickSupport}
                onQuickStatus={handleQuickStatus}
                canUpdate={perms.canUpdate}
                canDelete={perms.canDelete}
              />
            ) : (
              <EleitoresCardsView
                rows={paginated}
                highlightId={highlightId}
                highlightRef={highlightCardRef}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onCardClick={setEditTarget}
                onQuickSupport={handleQuickSupport}
                onQuickStatus={handleQuickStatus}
                onDelete={setDeleteTarget}
                landingMode={filters.view === "landing"}
                canUpdate={perms.canUpdate}
                canDelete={perms.canDelete}
              />
            )}

            {filtered.length > 0 && (
              <ListPagination
                page={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={ELEITORES_PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="apoiadores"
              />
            )}

            {(supporters?.length ?? 0) > 0 && (
              <ListCountFooter
                shown={filtered.length}
                total={supporters?.length ?? 0}
                label="apoiadores"
              />
            )}
          </CardContent>
        </Card>

        <EleitoresEditSheet
          supporter={editTarget}
          tenantId={tenantId}
          open={!!editTarget}
          onOpenChange={(o) => !o && setEditTarget(null)}
          leaderships={(leaderships ?? []).map((l) => ({ id: l.id, name: l.name }))}
          loading={updateMutation.isPending}
          onSubmit={(v: SupporterFormValues) => {
            if (!editTarget) return;
            updateMutation.mutate(
              { id: editTarget.id, ...supporterFormToPayload(v) },
              { onSuccess: () => setEditTarget(null) },
            );
          }}
        />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title="Excluir apoiador"
          description={buildDeleteDescription(deleteTarget)}
          loading={deleteMutation.isPending}
          onConfirm={() => {
            if (deleteTarget) {
              deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
            }
          }}
        />

        <ConfirmDeleteDialog
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          title="Excluir selecionados"
          description={buildDeleteDescription(null, selectedIds.size)}
          loading={deleteMutation.isPending}
          onConfirm={() => void confirmBulkDelete()}
        />
      </div>
    </ModuleRouteGuard>
  );
}
