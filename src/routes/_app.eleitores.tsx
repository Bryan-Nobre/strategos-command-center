import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Users,
  UserCheck,
  UserX,
  Crown,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ListCountFooter } from "@/components/common/ListCountFooter";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
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
import { useDashboardMetrics } from "@/hooks/use-dashboard";
import { LoadingState } from "@/components/common/LoadingState";
import {
  SupporterFormFields,
  supporterFormToPayload,
  supporterToFormValues,
} from "@/components/supporters/SupporterFormFields";
import {
  SUPPORT_LEVEL_LABELS,
  SUPPORTER_STATUS_LABELS,
  type SupporterFormValues,
} from "@/types/domain";
import { downloadCsv, buildCsvFilename } from "@/lib/csv/download";
import {
  supportersToCsv,
  parseSupportersCsv,
  getSupporterImportTemplateCsv,
} from "@/lib/csv/supporters-csv";
import { toast } from "sonner";

type EleitoresSearch = {
  bairro?: string;
};

export const Route = createFileRoute("/_app/eleitores")({
  validateSearch: (search: Record<string, unknown>): EleitoresSearch => ({
    bairro: typeof search.bairro === "string" && search.bairro ? search.bairro : undefined,
  }),
  component: EleitoresPage,
});

const apoioVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  forte: "default",
  medio: "secondary",
  indeciso: "outline",
  fraco: "destructive",
};

type SupporterRow = NonNullable<ReturnType<typeof useSupporters>["data"]>[number];

function EleitoresPage() {
  const { tenantId, activeTenant } = useTenant();
  const { bairro: bairroFromUrl } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SupporterRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupporterRow | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all");
  const [leadershipFilter, setLeadershipFilter] = useState<string>("all");
  const [supportFilter, setSupportFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState("");

  useEffect(() => {
    if (bairroFromUrl) {
      setNeighborhoodFilter(bairroFromUrl);
      setFiltersOpen(true);
    }
  }, [bairroFromUrl]);

  const { data: supporters, isLoading } = useSupporters(tenantId);
  const { data: leaderships } = useLeaderships(tenantId);
  const { data: metrics } = useDashboardMetrics(tenantId);
  const createMutation = useCreateSupporter(tenantId);
  const updateMutation = useUpdateSupporter(tenantId);
  const deleteMutation = useDeleteSupporter(tenantId);
  const importMutation = useImportSupporters(tenantId);

  const leadershipMap = useMemo(
    () => new Map((leaderships ?? []).map((l) => [l.id, l.name])),
    [leaderships],
  );

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    for (const s of supporters ?? []) {
      if (s.neighborhood) set.add(s.neighborhood);
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

  const filtered = useMemo(() => {
    return (supporters ?? []).filter((e) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        [e.name, e.phone, e.neighborhood, e.city, ...(e.tags ?? [])].some((f) =>
          f?.toLowerCase().includes(q),
        );
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      const matchesNeighborhood =
        neighborhoodFilter === "all" || e.neighborhood === neighborhoodFilter;
      const matchesLeadership =
        leadershipFilter === "all" ||
        (leadershipFilter === "none" ? !e.leadership_id : e.leadership_id === leadershipFilter);
      const matchesSupport = supportFilter === "all" || e.support_level === supportFilter;
      const matchesTag =
        !tagFilter || (e.tags ?? []).some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()));
      return (
        matchesQuery &&
        matchesStatus &&
        matchesNeighborhood &&
        matchesLeadership &&
        matchesSupport &&
        matchesTag
      );
    });
  }, [
    supporters,
    query,
    statusFilter,
    neighborhoodFilter,
    leadershipFilter,
    supportFilter,
    tagFilter,
  ]);

  const activeFilterCount = [
    statusFilter !== "all",
    neighborhoodFilter !== "all",
    leadershipFilter !== "all",
    supportFilter !== "all",
    !!tagFilter,
  ].filter(Boolean).length;

  function handleExport() {
    const slug = activeTenant?.slug ?? "campanha";
    const csv = supportersToCsv(filtered);
    downloadCsv(buildCsvFilename(slug, "apoiadores"), csv);
    toast.success(`${filtered.length} apoiador(es) exportado(s)`);
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
      importMutation.mutate(
        rows.map((r) => ({
          ...r,
          support_level: r.support_level ?? undefined,
        })),
      );
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleDownloadTemplate() {
    const slug = activeTenant?.slug ?? "campanha";
    downloadCsv(buildCsvFilename(slug, "modelo-importacao"), getSupporterImportTemplateCsv());
  }

  function clearFilters() {
    setStatusFilter("all");
    setNeighborhoodFilter("all");
    setLeadershipFilter("all");
    setSupportFilter("all");
    setTagFilter("");
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Eleitores"
        description="Gerencie sua base de apoiadores cadastrados."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
              Modelo CSV
            </Button>
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
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
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
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total cadastrados"
          value={String(metrics?.total_supporters ?? 0)}
          icon={Users}
          tone="primary"
          featured
        />
        <MetricCard
          label="Apoio forte"
          value={String(metrics?.strong_support ?? 0)}
          icon={UserCheck}
          tone="success"
        />
        <MetricCard
          label="Indecisos"
          value={String(metrics?.undecided ?? 0)}
          icon={UserX}
          tone="warning"
        />
        <MetricCard
          label="Lideranças"
          value={String(metrics?.leaderships ?? 0)}
          icon={Crown}
          tone="accent"
          featured
        />
      </div>

      <Card className="shadow-elegant">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, telefone, bairro..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
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
                  <SheetDescription>Refine a lista de apoiadores.</SheetDescription>
                </SheetHeader>
                <div className="mt-6 grid gap-4">
                  <div className="grid gap-2">
                    <Label>Status político</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                    <Label>Bairro</Label>
                    <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
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
                    <Select value={leadershipFilter} onValueChange={setLeadershipFilter}>
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
                    <Label>Grau de apoio</Label>
                    <Select value={supportFilter} onValueChange={setSupportFilter}>
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
                    <Select value={tagFilter || "all"} onValueChange={(v) => setTagFilter(v === "all" ? "" : v)}>
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
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {!filtered.length ? (
            <EmptyState
              icon={Users}
              title="Nenhum apoiador encontrado"
              description={
                supporters?.length
                  ? "Ajuste os filtros ou a busca."
                  : "Cadastre apoiadores manualmente ou importe um CSV."
              }
              actionLabel={!supporters?.length ? "Novo eleitor" : undefined}
              onAction={!supporters?.length ? () => setCreateOpen(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead>Liderança</TableHead>
                    <TableHead>Apoio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-muted-foreground">{e.phone ?? "—"}</TableCell>
                      <TableCell>
                        {e.neighborhood ?? "—"}
                        {e.city && (
                          <div className="text-xs text-muted-foreground">{e.city}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {e.leadership_id ? leadershipMap.get(e.leadership_id) ?? "—" : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={apoioVariant[e.support_level]}>
                          {SUPPORT_LEVEL_LABELS[e.support_level]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {SUPPORTER_STATUS_LABELS[e.status] ?? e.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(e.tags ?? []).slice(0, 2).map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                          {(e.tags?.length ?? 0) > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{(e.tags?.length ?? 0) - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditTarget(e)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(e)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar apoiador</DialogTitle>
            <DialogDescription>Atualize os dados do cadastro.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <SupporterFormFields
              key={editTarget.id}
              defaultValues={supporterToFormValues(editTarget)}
              leaderships={(leaderships ?? []).map((l) => ({ id: l.id, name: l.name }))}
              loading={updateMutation.isPending}
              submitLabel="Salvar alterações"
              onSubmit={(v: SupporterFormValues) => {
                updateMutation.mutate(
                  { id: editTarget.id, ...supporterFormToPayload(v) },
                  { onSuccess: () => setEditTarget(null) },
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir apoiador"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
          }
        }}
      />
    </div>
  );
}
