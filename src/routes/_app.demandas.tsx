import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent } from "react";
import {
  Plus,
  MapPin,
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DEMAND_CATEGORY_LABELS,
  DEMAND_PRIORITY_LABELS,
  DEMAND_STATUS_LABELS,
} from "@/types/domain";
import type { Enums } from "@/types/supabase";
import { DEEP_LINK_HIGHLIGHT_CLASS } from "@/lib/search-deep-link";
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

export const Route = createFileRoute("/_app/demandas")({
  validateSearch: (search: Record<string, unknown>): DemandasListSearch =>
    parseDemandasSearch(search),
  component: DemandasPage,
});

const columns = [
  {
    key: "aberto" as const,
    dbStatus: "aberto" as Enums<"demand_status">,
    title: "Aberto",
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    key: "andamento" as const,
    dbStatus: "em_andamento" as Enums<"demand_status">,
    title: "Em andamento",
    icon: Clock,
    color: "text-warning-foreground",
    bg: "bg-warning/15",
  },
  {
    key: "resolvido" as const,
    dbStatus: "resolvido" as Enums<"demand_status">,
    title: "Resolvido",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
  },
];

const prioVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  alta: "destructive",
  media: "secondary",
  baixa: "outline",
};

type DemandRow = NonNullable<ReturnType<typeof useDemands>["data"]>[number];

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
  const [deleteTarget, setDeleteTarget] = useState<DemandRow | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      urlSearch.bairro ||
      urlSearch.responsavel ||
      urlSearch.categoria ||
      urlSearch.status
    ) {
      setFiltersOpen(true);
    }
  }, [urlSearch.bairro, urlSearch.responsavel, urlSearch.categoria, urlSearch.status]);

  const [dragOverStatus, setDragOverStatus] = useState<Enums<"demand_status"> | null>(null);
  const [draggedDemandId, setDraggedDemandId] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (demands ?? []).filter((d) => {
      const matchQuery =
        !q ||
        [d.title, d.neighborhood, d.description].some((f) => f?.toLowerCase().includes(q));
      const matchCategory = filters.categoria === "all" || d.category === filters.categoria;
      const matchNeighborhood =
        filters.bairro === "all" || d.neighborhood === filters.bairro;
      const matchAssignee =
        filters.responsavel === "all" ||
        (filters.responsavel === "none" ? !d.assigned_to : d.assigned_to === filters.responsavel);
      const matchStatus = filters.status === "all" || d.status === filters.status;
      return matchQuery && matchCategory && matchNeighborhood && matchAssignee && matchStatus;
    });
  }, [demands, query, filters.categoria, filters.bairro, filters.responsavel, filters.status]);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, filtered]);

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
      }),
    );
  }

  const activeFilterCount = countActiveFilters([
    filters.categoria !== "all",
    filters.bairro !== "all",
    filters.responsavel !== "all",
    filters.status !== "all",
    !!query.trim(),
  ]);

  if (isLoading) return <LoadingState />;

  function moveDemand(id: string, status: Enums<"demand_status">) {
    updateMutation.mutate({ id, status });
  }

  function handleDragStart(e: ReactDragEvent, id: string) {
    setDraggedDemandId(id);
    // HTML5 drag-and-drop: persistimos o id no dataTransfer para recuperar no drop.
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDragOverStatus(null);
    setDraggedDemandId(null);
  }

  function handleDrop(e: ReactDragEvent, status: Enums<"demand_status">) {
    if (!perms.canUpdate) return;
    e.preventDefault();
    const idFromTransfer = e.dataTransfer.getData("text/plain");
    const id = idFromTransfer || draggedDemandId;
    if (id) moveDemand(id, status);
    setDragOverStatus(null);
    setDraggedDemandId(null);
  }

  return (
    <ModuleRouteGuard module="demands">
    <div className="space-y-8">
      <PageHeader
        title="Demandas da população"
        description="Kanban de solicitações por status."
        actions={
          <>
            <div className="relative hidden min-w-[200px] sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar título, bairro..."
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
                  <SheetDescription>Refine as demandas exibidas.</SheetDescription>
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
          placeholder="Buscar título, bairro..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {!demands?.length ? (
        <EmptyState
          icon={AlertCircle}
          title="Nenhuma demanda registrada"
          description="Cadastre solicitações da população para acompanhar no kanban."
          actionLabel={perms.canCreate ? "Nova demanda" : undefined}
          onAction={perms.canCreate ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {columns.map((col) => {
            const items = grouped[col.key];
            return (
              <div
                key={col.key}
                className={[
                  "flex flex-col rounded-xl border border-border bg-muted/30 p-4",
                  dragOverStatus === col.dbStatus ? "ring-2 ring-primary/50" : "",
                ].join(" ")}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (updateMutation.isPending || !perms.canUpdate) return;
                  setDragOverStatus(col.dbStatus);
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(e) => handleDrop(e, col.dbStatus)}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-md ${col.bg} ${col.color}`}
                    >
                      <col.icon className="h-4 w-4" />
                    </span>
                    <h3 className="font-semibold">{col.title}</h3>
                  </div>
                  <Badge variant="outline">{items.length}</Badge>
                </div>
                <div className="space-y-3">
                  {items.map((d) => (
                    <Card
                      key={d.id}
                      ref={d.id === highlightId ? highlightRef : undefined}
                      className={[
                        "shadow-sm",
                        draggedDemandId === d.id ? "opacity-70" : "",
                        d.id === highlightId ? DEEP_LINK_HIGHLIGHT_CLASS : "",
                        perms.canUpdate ? "cursor-grab" : "",
                      ].join(" ")}
                      draggable={perms.canUpdate && !updateMutation.isPending}
                      onDragStart={(e) => handleDragStart(e, d.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium">{d.title}</h4>
                          <div className="flex shrink-0 gap-1">
                            {perms.canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditTarget(d)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            )}
                            {perms.canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteTarget(d)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{DEMAND_CATEGORY_LABELS[d.category] ?? d.category}</span>
                          {d.neighborhood && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {d.neighborhood}
                            </span>
                          )}
                        </div>
                        {d.assigned_to && (
                          <p className="text-xs text-muted-foreground">
                            Responsável: {teamMap.get(d.assigned_to) ?? "—"}
                          </p>
                        )}
                        <Badge variant={prioVariant[d.priority]}>
                          {DEMAND_PRIORITY_LABELS[d.priority] ?? d.priority}
                        </Badge>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {columns
                            .filter((c) => c.dbStatus !== d.status)
                            .map((c) => (
                              <Button
                                key={c.key}
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={updateMutation.isPending}
                                onClick={() => moveDemand(d.id, c.dbStatus)}
                              >
                                → {c.title}
                              </Button>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!items.length && (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      Nenhuma demanda
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

type DemandFormValues = {
  title: string;
  category: Enums<"demand_category">;
  status: Enums<"demand_status">;
  priority: Enums<"demand_priority">;
  neighborhood: string;
  description: string;
  assigned_to: string;
};

function DemandFormDialog({
  title,
  team,
  loading,
  initial,
  onSubmit,
}: {
  title: string;
  team: { user_id: string; profiles: { full_name: string | null } }[];
  loading?: boolean;
  initial?: Partial<DemandFormValues>;
  onSubmit: (values: DemandFormValues) => void;
}) {
  const [formTitle, setFormTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<Enums<"demand_category">>(
    initial?.category ?? "infraestrutura",
  );
  const [status, setStatus] = useState<Enums<"demand_status">>(initial?.status ?? "aberto");
  const [priority, setPriority] = useState<Enums<"demand_priority">>(initial?.priority ?? "media");
  const [neighborhood, setNeighborhood] = useState(initial?.neighborhood ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [assignedTo, setAssignedTo] = useState(initial?.assigned_to ?? "");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Título</Label>
          <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Enums<"demand_category">)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEMAND_CATEGORY_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Prioridade</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Enums<"demand_priority">)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEMAND_PRIORITY_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Bairro</Label>
            <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Enums<"demand_status">)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEMAND_STATUS_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Responsável</Label>
          <Select
            value={assignedTo || "none"}
            onValueChange={(v) => setAssignedTo(v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {team.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.profiles.full_name ?? "Membro"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={formTitle.trim().length < 3 || loading}
          onClick={() =>
            onSubmit({
              title: formTitle.trim(),
              category,
              status,
              priority,
              neighborhood,
              description,
              assigned_to: assignedTo,
            })
          }
        >
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
