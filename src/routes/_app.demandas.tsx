import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, AlertCircle, Filter, Search } from "lucide-react";
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
import { useDemands, useCreateDemand, useUpdateDemand, useDeleteDemand } from "@/hooks/use-demands";
import { useTeamMembers } from "@/hooks/use-team";
import { LoadingState } from "@/components/common/LoadingState";
import { DEMAND_CATEGORY_LABELS, DEMAND_STATUS_LABELS } from "@/types/domain";
import type { Enums } from "@/types/supabase";
import {
  demandasSearchToFilterState,
  filterStateToDemandasSearch,
  parseDemandasSearch,
  serializeDemandasSearch,
  type DemandasListSearch,
} from "@/lib/list-search/demandas";
import { countActiveFilters } from "@/lib/list-search/utils";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import { ListUrlActions } from "@/components/common/ListUrlActions";
import { DemandasCompactBar } from "@/components/demandas/DemandasCompactBar";
import { DemandasOriginChips } from "@/components/demandas/DemandasOriginChips";
import { DemandasKanban, type DemandRow } from "@/components/demandas/DemandasKanban";
import { DemandDetailSheet } from "@/components/demandas/DemandDetailSheet";
import { DemandFormDialog } from "@/components/demandas/DemandFormDialog";

export const Route = createFileRoute("/_app/demandas")({
  validateSearch: (search: Record<string, unknown>): DemandasListSearch =>
    parseDemandasSearch(search),
  component: DemandasPage,
});

function DemandasPage() {
  const { tenantId } = useTenant();
  const urlSearch = Route.useSearch();
  const highlightId = urlSearch.id;
  const filters = demandasSearchToFilterState(urlSearch);
  const { localText: query, setLocalText: setQuery, setSearch } = useSyncedListSearch({
    search: urlSearch,
    serialize: serializeDemandasSearch,
  });

  const { data: demands, isLoading } = useDemands(tenantId);
  const { data: team } = useTeamMembers(tenantId);
  const createMutation = useCreateDemand(tenantId);
  const updateMutation = useUpdateDemand(tenantId);
  const deleteMutation = useDeleteDemand(tenantId);
  const perms = useCrudPermissions("demands");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DemandRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<DemandRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DemandRow | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (
      urlSearch.bairro ||
      urlSearch.responsavel ||
      urlSearch.categoria ||
      urlSearch.status ||
      urlSearch.origem
    ) {
      setFiltersOpen(true);
    }
  }, [urlSearch.bairro, urlSearch.responsavel, urlSearch.categoria, urlSearch.status, urlSearch.origem]);

  const teamMap = useMemo(
    () => new Map((team ?? []).map((m) => [m.user_id, m.profiles.full_name ?? "Membro"])),
    [team],
  );

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    for (const d of demands ?? []) {
      if (d.neighborhood) set.add(d.neighborhood);
    }
    return [...set].sort();
  }, [demands]);

  const stats = useMemo(() => {
    const all = demands ?? [];
    return {
      total: all.length,
      abertas: all.filter((d) => d.status === "aberto").length,
      emAndamento: all.filter((d) => d.status === "em_andamento").length,
      resolvidas: all.filter((d) => d.status === "resolvido").length,
      landing: all.filter((d) => d.source === "landing").length,
      manual: all.filter((d) => d.source !== "landing").length,
    };
  }, [demands]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (demands ?? []).filter((d) => {
      const matchQuery =
        !q ||
        [
          d.title,
          d.neighborhood,
          d.description,
          d.requester_name,
          d.requester_phone,
        ].some((f) => f?.toLowerCase().includes(q));
      const matchCategory = filters.categoria === "all" || d.category === filters.categoria;
      const matchNeighborhood =
        filters.bairro === "all" || d.neighborhood === filters.bairro;
      const matchAssignee =
        filters.responsavel === "all" ||
        (filters.responsavel === "none" ? !d.assigned_to : d.assigned_to === filters.responsavel);
      const matchStatus = filters.status === "all" || d.status === filters.status;
      const matchOrigem =
        filters.origem === "all" ||
        (filters.origem === "landing" ? d.source === "landing" : d.source !== "landing");
      return (
        matchQuery &&
        matchCategory &&
        matchNeighborhood &&
        matchAssignee &&
        matchStatus &&
        matchOrigem
      );
    });
  }, [
    demands,
    query,
    filters.categoria,
    filters.bairro,
    filters.responsavel,
    filters.status,
    filters.origem,
  ]);

  const grouped = {
    aberto: filtered.filter((d) => d.status === "aberto"),
    andamento: filtered.filter((d) => d.status === "em_andamento"),
    resolvido: filtered.filter((d) => d.status === "resolvido"),
  };

  function patchFilter(patch: Partial<typeof filters>) {
    setSearch(filterStateToDemandasSearch({ ...filters, ...patch }, highlightId));
  }

  function clearFilters() {
    setQuery("");
    setSearch(
      filterStateToDemandasSearch({
        busca: "",
        bairro: "all",
        categoria: "all",
        responsavel: "all",
        status: "all",
        origem: "all",
      }),
    );
  }

  const activeFilterCount = countActiveFilters([
    filters.categoria !== "all",
    filters.bairro !== "all",
    filters.responsavel !== "all",
    filters.status !== "all",
    filters.origem !== "all",
    !!query.trim(),
  ]);

  if (isLoading) return <LoadingState />;

  function moveDemand(id: string, status: Enums<"demand_status">) {
    updateMutation.mutate({ id, status });
  }

  return (
    <ModuleRouteGuard module="demands">
      <div className="space-y-6">
        <PageHeader
          title="Demandas da população"
          description="Solicitações da equipe e da landing — arraste entre colunas para atualizar o status."
          actions={
            <>
              <div className="relative hidden min-w-[200px] sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar título, bairro, cidadão..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
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
                    <SheetDescription>Refine as demandas exibidas no kanban.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 grid gap-4">
                    <FilterSelect
                      label="Categoria"
                      value={filters.categoria}
                      onChange={(v) => patchFilter({ categoria: v })}
                      options={[
                        { value: "all", label: "Todas" },
                        ...Object.entries(DEMAND_CATEGORY_LABELS).map(([k, l]) => ({
                          value: k,
                          label: l,
                        })),
                      ]}
                    />
                    <FilterSelect
                      label="Bairro"
                      value={filters.bairro}
                      onChange={(v) => patchFilter({ bairro: v })}
                      options={[
                        { value: "all", label: "Todos" },
                        ...neighborhoods.map((n) => ({ value: n, label: n })),
                      ]}
                    />
                    <FilterSelect
                      label="Responsável"
                      value={filters.responsavel}
                      onChange={(v) => patchFilter({ responsavel: v })}
                      options={[
                        { value: "all", label: "Todos" },
                        { value: "none", label: "Sem responsável" },
                        ...(team ?? []).map((m) => ({
                          value: m.user_id,
                          label: m.profiles.full_name ?? m.user_id,
                        })),
                      ]}
                    />
                    <FilterSelect
                      label="Status"
                      value={filters.status}
                      onChange={(v) => patchFilter({ status: v })}
                      options={[
                        { value: "all", label: "Todos" },
                        ...Object.entries(DEMAND_STATUS_LABELS).map(([k, l]) => ({
                          value: k,
                          label: l,
                        })),
                      ]}
                    />
                    <ListUrlActions onClear={clearFilters} />
                  </div>
                </SheetContent>
              </Sheet>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                {perms.canCreate && (
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Nova demanda
                    </Button>
                  </DialogTrigger>
                )}
                <DemandFormDialog
                  title="Nova demanda"
                  team={team ?? []}
                  loading={createMutation.isPending}
                  onSubmit={(values) => {
                    createMutation.mutate(
                      {
                        title: values.title,
                        category: values.category,
                        neighborhood: values.neighborhood || null,
                        description: values.description || null,
                        status: values.status,
                        priority: values.priority,
                        assigned_to: values.assigned_to || null,
                        source: "manual",
                      },
                      { onSuccess: () => setCreateOpen(false) },
                    );
                  }}
                />
              </Dialog>
            </>
          }
        />

        <div className="relative sm:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {!!demands?.length && (
          <>
            <DemandasCompactBar
              total={stats.total}
              filtered={filtered.length}
              abertas={grouped.aberto.length}
              emAndamento={grouped.andamento.length}
              resolvidas={grouped.resolvido.length}
              landingCount={stats.landing}
            />
            <DemandasOriginChips
              origem={filters.origem}
              onChange={(origem) => patchFilter({ origem })}
              counts={{
                all: demands.length,
                landing: stats.landing,
                manual: stats.manual,
              }}
            />
          </>
        )}

        {!demands?.length ? (
          <EmptyState
            icon={AlertCircle}
            title="Nenhuma demanda registrada"
            description="Cadastre na equipe ou compartilhe a landing para cidadãos registrarem melhorias."
            actionLabel={perms.canCreate ? "Nova demanda" : undefined}
            onAction={perms.canCreate ? () => setCreateOpen(true) : undefined}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="Nenhuma demanda com estes filtros"
            description="Ajuste os filtros ou a busca."
            actionLabel="Limpar filtros"
            onAction={clearFilters}
          />
        ) : (
          <DemandasKanban
            grouped={grouped}
            teamMap={teamMap}
            highlightId={highlightId}
            canUpdate={perms.canUpdate}
            canDelete={perms.canDelete}
            isUpdating={updateMutation.isPending}
            onMove={moveDemand}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
            onOpenDetail={setDetailTarget}
          />
        )}

        <DemandDetailSheet
          demand={detailTarget}
          teamMap={teamMap}
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
            <DemandFormDialog
              title="Editar demanda"
              team={team ?? []}
              loading={updateMutation.isPending}
              initial={{
                title: editTarget.title,
                category: editTarget.category,
                status: editTarget.status,
                priority: editTarget.priority,
                neighborhood: editTarget.neighborhood ?? "",
                description: editTarget.description ?? "",
                assigned_to: editTarget.assigned_to ?? "",
              }}
              onSubmit={(values) => {
                updateMutation.mutate(
                  {
                    id: editTarget.id,
                    title: values.title,
                    category: values.category,
                    neighborhood: values.neighborhood || null,
                    description: values.description || null,
                    status: values.status,
                    priority: values.priority,
                    assigned_to: values.assigned_to || null,
                  },
                  { onSuccess: () => setEditTarget(null) },
                );
              }}
            />
          )}
        </Dialog>

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title="Excluir demanda"
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
