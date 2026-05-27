import { createFileRoute } from "@tanstack/react-router";
import { Plus, Crown, Users, Pencil, Trash2, Eye, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { useCrudPermissions } from "@/hooks/use-crud-permissions";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import {
  useLeaderships,
  useCreateLeadership,
  useUpdateLeadership,
  useDeleteLeadership,
} from "@/hooks/use-leaderships";
import { useSupportersByLeadership } from "@/hooks/use-supporters";
import { LoadingState } from "@/components/common/LoadingState";
import { SUPPORTER_STATUS_LABELS, SUPPORT_LEVEL_LABELS } from "@/types/domain";
import { DEEP_LINK_HIGHLIGHT_CLASS } from "@/lib/search-deep-link";
import {
  parseLiderancasSearch,
  serializeLiderancasSearch,
  type LiderancasListSearch,
} from "@/lib/list-search/liderancas";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import { ListUrlActions } from "@/components/common/ListUrlActions";

export const Route = createFileRoute("/_app/liderancas")({
  validateSearch: (search: Record<string, unknown>): LiderancasListSearch =>
    parseLiderancasSearch(search),
  component: LiderancasPage,
});

type LeadershipRow = NonNullable<ReturnType<typeof useLeaderships>["data"]>[number];

function LiderancasPage() {
  const { tenantId } = useTenant();
  const urlSearch = Route.useSearch();
  const highlightId = urlSearch.id;
  const { localText: query, setLocalText: setQuery, setSearch } = useSyncedListSearch({
    search: urlSearch,
    serialize: serializeLiderancasSearch,
  });

  const { data: list, isLoading } = useLeaderships(tenantId);
  const createMutation = useCreateLeadership(tenantId);
  const updateMutation = useUpdateLeadership(tenantId);
  const deleteMutation = useDeleteLeadership(tenantId);
  const perms = useCrudPermissions("leaderships");

  const highlightRef = useRef<HTMLDivElement>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeadershipRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadershipRow | null>(null);
  const [viewTarget, setViewTarget] = useState<LeadershipRow | null>(null);

  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [estimatedVotes, setEstimatedVotes] = useState("0");

  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editVotes, setEditVotes] = useState("0");

  const filteredList = useMemo(() => {
    const q = query.toLowerCase();
    return (list ?? []).filter(
      (l) => !q || [l.name, l.region].some((f) => f?.toLowerCase().includes(q)),
    );
  }, [list, query]);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, filteredList]);

  function clearFilters() {
    setQuery("");
    setSearch({});
  }

  if (isLoading) return <LoadingState />;

  function openEdit(l: LeadershipRow) {
    setEditTarget(l);
    setEditName(l.name);
    setEditRegion(l.region ?? "");
    setEditVotes(String(l.estimated_votes ?? 0));
  }

  return (
    <ModuleRouteGuard module="leaderships">
    <div className="space-y-8">
      <PageHeader
        title="Lideranças"
        description="Gerencie lideranças políticas e sua capilaridade regional."
        actions={
          perms.canCreate ? (
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
                  <Label>Votos estimados</Label>
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
                        onSuccess: () => {
                          setCreateOpen(false);
                          setName("");
                          setRegion("");
                          setEstimatedVotes("0");
                        },
                      },
                    );
                  }}
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nome ou região..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {(query.trim() || highlightId) && <ListUrlActions onClear={clearFilters} />}
      </div>

      {!(list?.length) ? (
        <EmptyState
          icon={Crown}
          title="Nenhuma liderança cadastrada"
          description="Cadastre lideranças para organizar apoiadores por referência política."
          actionLabel={perms.canCreate ? "Nova liderança" : undefined}
          onAction={perms.canCreate ? () => setCreateOpen(true) : undefined}
        />
      ) : !filteredList.length ? (
        <EmptyState
          icon={Crown}
          title="Nenhuma liderança encontrada"
          description="Ajuste a busca ou cadastre uma nova liderança."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredList.map((l) => (
            <Card
              key={l.id}
              ref={l.id === highlightId ? highlightRef : undefined}
              className={[
                "shadow-elegant",
                l.id === highlightId ? DEEP_LINK_HIGHLIGHT_CLASS : "",
              ].join(" ")}
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-chart-3" />
                    <div>
                      <h3 className="font-semibold">{l.name}</h3>
                      <p className="text-xs text-muted-foreground">{l.region ?? "Sem região"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewTarget(l)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {perms.canUpdate && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(l)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    )}
                    {perms.canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteTarget(l)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>{l.apoiadores}</strong> apoiadores
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Votos est.: </span>
                    <strong>{l.estimated_votes ?? 0}</strong>
                  </div>
                </div>
                {l.apoiadores > 0 && (
                  <Badge className="mt-3" variant="secondary">
                    Força regional ativa
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar liderança</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Região</Label>
              <Input value={editRegion} onChange={(e) => setEditRegion(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Votos estimados</Label>
              <Input
                type="number"
                min={0}
                value={editVotes}
                onChange={(e) => setEditVotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!editName.trim() || updateMutation.isPending}
              onClick={() => {
                if (!editTarget) return;
                updateMutation.mutate(
                  {
                    id: editTarget.id,
                    name: editName.trim(),
                    region: editRegion.trim() || null,
                    estimated_votes: Number(editVotes) || 0,
                  },
                  { onSuccess: () => setEditTarget(null) },
                );
              }}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadershipSupportersDialog
        leadership={viewTarget}
        tenantId={tenantId}
        onClose={() => setViewTarget(null)}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir liderança"
        description={
          deleteTarget?.apoiadores
            ? `"${deleteTarget.name}" possui ${deleteTarget.apoiadores} apoiador(es) vinculados. Eles serão desvinculados automaticamente antes da exclusão.`
            : `Tem certeza que deseja excluir "${deleteTarget?.name}"?`
        }
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

function LeadershipSupportersDialog({
  leadership,
  tenantId,
  onClose,
}: {
  leadership: LeadershipRow | null;
  tenantId: string;
  onClose: () => void;
}) {
  const { data: supporters, isLoading } = useSupportersByLeadership(tenantId, leadership?.id ?? null);

  return (
    <Dialog open={!!leadership} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Apoiadores de {leadership?.name}</DialogTitle>
          <DialogDescription>
            {leadership?.apoiadores ?? 0} apoiador(es) vinculados a esta liderança.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <LoadingState />
        ) : !(supporters?.length) ? (
          <EmptyState
            icon={Users}
            title="Nenhum apoiador vinculado"
            description="Vincule apoiadores pela tela de Eleitores."
          />
        ) : (
          <div className="max-h-80 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Apoio</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supporters.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.neighborhood ?? "—"}</TableCell>
                    <TableCell>{SUPPORT_LEVEL_LABELS[s.support_level] ?? s.support_level}</TableCell>
                    <TableCell>{SUPPORTER_STATUS_LABELS[s.status] ?? s.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
