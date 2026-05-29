import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LeadershipVoteProgress } from "@/components/liderancas/LeadershipVoteProgress";
import {
  useLeadershipChapas,
  useCreateLeadershipChapa,
  useUpdateLeadershipChapa,
  useDeleteLeadershipChapa,
} from "@/hooks/use-leadership-chapas";
import { LoadingState } from "@/components/common/LoadingState";

export type LeadershipListItem = {
  id: string;
  name: string;
  region: string | null;
  estimated_votes: number;
  apoiadores: number;
  pledged_votes: number;
  chapa_count: number;
};

export function LeadershipDetailSheet({
  leadership,
  tenantId,
  open,
  onOpenChange,
  canUpdate,
  onSaveLeadership,
  savePending,
}: {
  leadership: LeadershipListItem | null;
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdate: boolean;
  onSaveLeadership: (payload: {
    name: string;
    region: string | null;
    estimated_votes: number;
  }) => void;
  savePending?: boolean;
}) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [votes, setVotes] = useState("0");
  const [newChapaName, setNewChapaName] = useState("");
  const [newChapaWeight, setNewChapaWeight] = useState("1");

  const leadershipId = leadership?.id ?? null;
  const { data: chapas, isLoading: chapasLoading } = useLeadershipChapas(tenantId, leadershipId);
  const createChapa = useCreateLeadershipChapa(tenantId, leadershipId ?? "");
  const updateChapa = useUpdateLeadershipChapa(tenantId, leadershipId ?? "");
  const deleteChapa = useDeleteLeadershipChapa(tenantId, leadershipId ?? "");

  const pledged = leadership?.pledged_votes ?? 0;
  const target = leadership?.estimated_votes ?? 0;

  useEffect(() => {
    if (!leadership) return;
    setName(leadership.name);
    setRegion(leadership.region ?? "");
    setVotes(String(leadership.estimated_votes ?? 0));
  }, [leadership?.id, leadership?.name, leadership?.region, leadership?.estimated_votes]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{leadership?.name ?? "Liderança"}</SheetTitle>
          <SheetDescription>
            Meta de votos = associados esperados ao partido/chapa. Apoios na landing somam na barra.
          </SheetDescription>
        </SheetHeader>

        {leadership && (
          <div className="mt-6 space-y-6">
            <LeadershipVoteProgress pledged={pledged} target={target} />

            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <Link to="/eleitores" search={{ lideranca: leadership.id }}>
                <ExternalLink className="h-4 w-4" />
                Ver apoiadores vinculados ({leadership.apoiadores})
              </Link>
            </Button>

            {canUpdate && (
              <div className="space-y-4 rounded-lg border border-border/70 p-4">
                <h3 className="text-sm font-semibold">Dados da liderança</h3>
                <div className="grid gap-3">
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
                      value={votes}
                      onChange={(e) => setVotes(e.target.value)}
                    />
                  </div>
                  <Button
                    disabled={!name.trim() || savePending}
                    onClick={() =>
                      onSaveLeadership({
                        name: name.trim(),
                        region: region.trim() || null,
                        estimated_votes: Number(votes) || 0,
                      })
                    }
                  >
                    {savePending ? "Salvando…" : "Salvar liderança"}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Chapas na landing</h3>
                <span className="text-xs text-muted-foreground">{chapas?.length ?? 0} cadastrada(s)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cada chapa aparece na página pública. O peso define quanto cada apoio soma na meta desta
                liderança.
              </p>

              {chapasLoading ? (
                <LoadingState />
              ) : (
                <ul className="space-y-2">
                  {(chapas ?? []).map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Peso {c.vote_weight} · {c.pledge_count ?? 0} apoio(s) · +{c.pledged_votes ?? 0}{" "}
                          na meta
                        </p>
                      </div>
                      {canUpdate && (
                        <>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`pub-${c.id}`} className="text-[10px]">
                              Landing
                            </Label>
                            <Switch
                              id={`pub-${c.id}`}
                              checked={c.is_published}
                              onCheckedChange={(checked) =>
                                updateChapa.mutate({ id: c.id, is_published: checked })
                              }
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteChapa.mutate(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {canUpdate && leadershipId && (
                <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                  <Input
                    placeholder="Nome da chapa / candidato"
                    value={newChapaName}
                    onChange={(e) => setNewChapaName(e.target.value)}
                    className="min-w-[140px] flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    title="Peso na meta"
                    value={newChapaWeight}
                    onChange={(e) => setNewChapaWeight(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!newChapaName.trim() || createChapa.isPending}
                    onClick={() => {
                      createChapa.mutate(
                        {
                          name: newChapaName.trim(),
                          vote_weight: Math.max(1, Number(newChapaWeight) || 1),
                          is_published: true,
                          display_order: (chapas?.length ?? 0) + 1,
                        },
                        {
                          onSuccess: () => {
                            setNewChapaName("");
                            setNewChapaWeight("1");
                          },
                        },
                      );
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Chapa
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
