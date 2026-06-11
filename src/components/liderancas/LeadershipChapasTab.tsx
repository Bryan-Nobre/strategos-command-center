import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LoadingState } from "@/components/common/LoadingState";
import {
  useLeadershipChapas,
  useCreateLeadershipChapa,
  useUpdateLeadershipChapa,
  useDeleteLeadershipChapa,
} from "@/hooks/use-leadership-chapas";
import { useState } from "react";
import { LEADERSHIP_POINTS_HELP } from "@/lib/leadership-metrics-copy";

export function LeadershipChapasTab({
  tenantId,
  leadershipId,
  canUpdate,
}: {
  tenantId: string;
  leadershipId: string;
  canUpdate: boolean;
}) {
  const [newChapaName, setNewChapaName] = useState("");

  const { data: chapas, isLoading } = useLeadershipChapas(tenantId, leadershipId);
  const createChapa = useCreateLeadershipChapa(tenantId, leadershipId);
  const updateChapa = useUpdateLeadershipChapa(tenantId, leadershipId);
  const deleteChapa = useDeleteLeadershipChapa(tenantId, leadershipId);

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        {LEADERSHIP_POINTS_HELP.chapaHelp}
      </p>

      {isLoading ? (
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
                <p className="text-[11px] text-muted-foreground">
                  {c.pledge_count ?? 0} apoio(s) · cada apoiador conta{" "}
                  <strong className="text-foreground">1 ponto</strong> nesta liderança
                </p>
              </div>
              {canUpdate && (
                <>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`pub-${c.id}`} className="text-[10px]">
                      Landpage
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

      {canUpdate && (
        <div className="space-y-3 border-t border-border/60 pt-3">
          <div className="grid gap-2">
            <Label htmlFor="new-chapa-name">Nome da chapa / candidato</Label>
            <Input
              id="new-chapa-name"
              placeholder="Ex.: Chapa 1234 — Vereador João"
              value={newChapaName}
              onChange={(e) => setNewChapaName(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            disabled={!newChapaName.trim() || createChapa.isPending}
            onClick={() => {
              createChapa.mutate(
                {
                  name: newChapaName.trim(),
                  vote_weight: 1,
                  is_published: true,
                  display_order: (chapas?.length ?? 0) + 1,
                },
                {
                  onSuccess: () => {
                    setNewChapaName("");
                  },
                },
              );
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Adicionar chapa
          </Button>
        </div>
      )}
    </div>
  );
}
