import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, FileSpreadsheet, LayoutGrid, LayoutList, Crown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTenant } from "@/hooks/use-tenant";
import { useCrudPermissions } from "@/hooks/use-crud-permissions";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import {
  useLeaderships,
  useCreateLeadership,
  useUpdateLeadership,
  useDeleteLeadership,
} from "@/hooks/use-leaderships";
import { LoadingState } from "@/components/common/LoadingState";
import { LeadershipCompactBar } from "@/components/liderancas/LeadershipCompactBar";
import { LeadershipCardsView } from "@/components/liderancas/LeadershipCardsView";
import { LeadershipTableView } from "@/components/liderancas/LeadershipTableView";
import {
  LeadershipDetailSheet,
  type LeadershipListItem,
} from "@/components/liderancas/LeadershipDetailSheet";
import {
  parseLiderancasSearch,
  serializeLiderancasSearch,
  liderancasSearchToFilterState,
  filterStateToLiderancasSearch,
} from "@/lib/list-search/liderancas";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import { ListUrlActions } from "@/components/common/ListUrlActions";
import {
  buildLeadershipExcelFilename,
  downloadLeadershipsExcel,
} from "@/lib/excel/leaderships-export";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/liderancas")({
  validateSearch: (search: Record<string, unknown>) => parseLiderancasSearch(search),
  component: LiderancasPage,
});

function LiderancasPage() {
  const { tenantId, activeTenant } = useTenant();
  const urlSearch = Route.useSearch();
  const highlightId = urlSearch.id;
  const filters = liderancasSearchToFilterState(urlSearch);
  const { localText: query, setLocalText: setQuery, setSearch } = useSyncedListSearch({
    search: urlSearch,
    serialize: serializeLiderancasSearch,
  });

  const highlightCardRef = useRef<HTMLDivElement>(null);
  const highlightRowRef = useRef<HTMLTableRowElement>(null);

  const { data: list, isLoading } = useLeaderships(tenantId);
  const createMutation = useCreateLeadership(tenantId);
  const updateMutation = useUpdateLeadership(tenantId);
  const deleteMutation = useDeleteLeadership(tenantId);
  const perms = useCrudPermissions("leaderships");

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<LeadershipListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadershipListItem | null>(null);
  const [exporting, setExporting] = useState(false);

  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [estimatedVotes, setEstimatedVotes] = useState("0");

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const l of list ?? []) {
      if (l.region?.trim()) set.add(l.region.trim());
    }
    return [...set].sort();
  }, [list]);

  const filteredList = useMemo(() => {
    const q = query.toLowerCase();
    return (list ?? []).filter((l) => {
      const matchesQuery =
        !q || [l.name, l.region].some((f) => f?.toLowerCase().includes(q));
      const matchesRegion = filters.regiao === "all" || l.region === filters.regiao;
      return matchesQuery && matchesRegion;
    }) as LeadershipListItem[];
  }, [list, query, filters.regiao]);

  const totals = useMemo(() => {
    const items = filteredList;
    return {
      pledged: items.reduce((s, l) => s + (l.pledged_votes ?? 0), 0),
      target: items.reduce((s, l) => s + (l.estimated_votes ?? 0), 0),
    };
  }, [filteredList]);

  useEffect(() => {
    const ref = filters.view === "table" ? highlightRowRef : highlightCardRef;
    if (highlightId && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, filteredList, filters.view]);

  function patchFilter(patch: Partial<typeof filters>) {
    setSearch(filterStateToLiderancasSearch({ ...filters, ...patch }, highlightId));
  }

  function clearFilters() {
    setQuery("");
    setSearch(filterStateToLiderancasSearch({ busca: "", regiao: "all", view: filters.view }));
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      const slug = activeTenant?.slug ?? "campanha";
      await downloadLeadershipsExcel({
        filename: buildLeadershipExcelFilename(slug),
        rows: filteredList.map((l) => ({
          name: l.name,
          region: l.region,
          estimated_votes: l.estimated_votes ?? 0,
          pledged_votes: l.pledged_votes ?? 0,
          apoiadores: l.apoiadores,
          chapa_count: l.chapa_count ?? 0,
        })),
      });
      toast.success("Planilha de lideranças exportada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao exportar");
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <ModuleRouteGuard module="leaderships">
      <div className="liderancas-page space-y-6">
        <PageHeader
          title="Lideranças"
          description="Rede política, chapas na landing e meta de associados ao partido — apoios somam na barra de cada liderança."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={exporting || !filteredList.length}
                onClick={() => void handleExportExcel()}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              {perms.canCreate && (
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Nova liderança
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar liderança</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Nome</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Região</Label>
                        <Input value={region} onChange={(e) => setRegion(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Meta de votos (associados ao partido)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={estimatedVotes}
                          onChange={(e) => setEstimatedVotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        disabled={!name.trim() || createMutation.isPending}
                        onClick={() => {
                          createMutation.mutate(
                            {
                              name: name.trim(),
                              region: region.trim() || null,
                              estimated_votes: Number(estimatedVotes) || 0,
                            },
                            {
                              onSuccess: (row) => {
                                setCreateOpen(false);
                                setName("");
                                setRegion("");
                                setEstimatedVotes("0");
                                setDetailTarget({
                                  ...row,
                                  apoiadores: 0,
                                  pledged_votes: 0,
                                  chapa_count: 0,
                                });
                              },
                            },
                          );
                        }}
                      >
                        {createMutation.isPending ? "Salvando…" : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </>
          }
        />

        <LeadershipCompactBar
          total={list?.length ?? 0}
          filtered={filteredList.length}
          totalPledged={totals.pledged}
          totalTarget={totals.target}
        />

        <Card className="shadow-elegant overflow-hidden">
          <CardContent className="p-0">
            <div className="space-y-3 border-b border-border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar nome ou região..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ToggleGroup
                  type="single"
                  value={filters.view}
                  onValueChange={(v) => v && patchFilter({ view: v as typeof filters.view })}
                >
                  <ToggleGroupItem value="cards" className="gap-1.5 px-3">
                    <LayoutGrid className="h-4 w-4" />
                    Cards
                  </ToggleGroupItem>
                  <ToggleGroupItem value="table" className="gap-1.5 px-3">
                    <LayoutList className="h-4 w-4" />
                    Tabela
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Região
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={filters.regiao === "all" ? "default" : "outline"}
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => patchFilter({ regiao: "all" })}
                >
                  Todas
                </Button>
                {regions.map((r) => (
                  <Button
                    key={r}
                    type="button"
                    size="sm"
                    variant={filters.regiao === r ? "default" : "outline"}
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={() => patchFilter({ regiao: r })}
                  >
                    {r}
                  </Button>
                ))}
                {(query.trim() || filters.regiao !== "all") && (
                  <ListUrlActions onClear={clearFilters} />
                )}
              </div>
            </div>

            {!list?.length ? (
              <EmptyState
                icon={Crown}
                title="Nenhuma liderança cadastrada"
                description="Cadastre lideranças, defina a meta de associados e adicione chapas para a landing."
                actionLabel={perms.canCreate ? "Nova liderança" : undefined}
                onAction={perms.canCreate ? () => setCreateOpen(true) : undefined}
              />
            ) : !filteredList.length ? (
              <EmptyState
                title="Nenhuma liderança encontrada"
                description="Ajuste a busca ou o filtro de região."
              />
            ) : filters.view === "table" ? (
              <LeadershipTableView
                rows={filteredList}
                highlightId={highlightId}
                highlightRef={highlightRowRef}
                onOpen={setDetailTarget}
                onDelete={setDeleteTarget}
                canUpdate={perms.canUpdate}
                canDelete={perms.canDelete}
              />
            ) : (
              <LeadershipCardsView
                rows={filteredList}
                highlightId={highlightId}
                highlightRef={highlightCardRef}
                onOpen={setDetailTarget}
                onDelete={setDeleteTarget}
                canUpdate={perms.canUpdate}
                canDelete={perms.canDelete}
              />
            )}
          </CardContent>
        </Card>

        <LeadershipDetailSheet
          leadership={detailTarget}
          tenantId={tenantId}
          open={!!detailTarget}
          onOpenChange={(o) => !o && setDetailTarget(null)}
          canUpdate={perms.canUpdate}
          savePending={updateMutation.isPending}
          onSaveLeadership={(payload) => {
            if (!detailTarget) return;
            updateMutation.mutate(
              { id: detailTarget.id, ...payload },
              {
                onSuccess: () => {
                  setDetailTarget((prev) => (prev ? { ...prev, ...payload } : null));
                },
              },
            );
          }}
        />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title="Excluir liderança"
          description={
            deleteTarget
              ? `"${deleteTarget.name}" possui ${deleteTarget.apoiadores} apoiador(es) e ${deleteTarget.chapa_count} chapa(s). Apoiadores serão desvinculados; chapas e apoios na landing serão removidos.`
              : ""
          }
          loading={deleteMutation.isPending}
          onConfirm={() => {
            if (deleteTarget) {
              deleteMutation.mutate(deleteTarget.id, {
                onSuccess: () => {
                  setDeleteTarget(null);
                  if (detailTarget?.id === deleteTarget.id) setDetailTarget(null);
                },
              });
            }
          }}
        />
      </div>
    </ModuleRouteGuard>
  );
}
