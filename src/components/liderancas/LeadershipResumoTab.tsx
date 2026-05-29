import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadershipVoteProgress } from "@/components/liderancas/LeadershipVoteProgress";
import type { LeadershipListItem } from "@/components/liderancas/leadership-list-types";

export function LeadershipResumoTab({
  leadership,
  canUpdate,
  savePending,
  name,
  region,
  votes,
  onNameChange,
  onRegionChange,
  onVotesChange,
  onSave,
}: {
  leadership: LeadershipListItem;
  canUpdate: boolean;
  savePending?: boolean;
  name: string;
  region: string;
  votes: string;
  onNameChange: (v: string) => void;
  onRegionChange: (v: string) => void;
  onVotesChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-5">
      <LeadershipVoteProgress
        pledged={leadership.pledged_votes}
        target={leadership.estimated_votes}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md border bg-muted/30 px-2 py-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{leadership.political_strength_score}</p>
          <p className="text-[10px] text-muted-foreground">Força (score)</p>
        </div>
        <div className="rounded-md border bg-muted/30 px-2 py-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{leadership.active_supporters_30d ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">Ativos 30d</p>
        </div>
        <div className="rounded-md border bg-muted/30 px-2 py-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{leadership.hot_supporters ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">Quentes</p>
        </div>
        <div className="rounded-md border bg-muted/30 px-2 py-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{leadership.weekly_growth}</p>
          <p className="text-[10px] text-muted-foreground">+7 dias vínculos</p>
        </div>
      </div>

      {leadership.linked_supporters > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            Rede fria/inativa:{" "}
            <strong className="text-foreground">
              {leadership.cold_network_pct ?? 0}%
            </strong>{" "}
            ({leadership.inactive_supporters ?? 0} de {leadership.linked_supporters})
          </span>
          <span>
            Score médio:{" "}
            <strong className="text-foreground tabular-nums">
              {leadership.avg_activity_score ?? 0}
            </strong>
          </span>
        </div>
      )}

      {leadership.landing_only_network && leadership.linked_supporters > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Rede depende apenas de apoios na landing (sem vínculos manuais no CRM).
        </p>
      )}

      <Button variant="outline" size="sm" className="w-full gap-2" asChild>
        <Link to="/eleitores" search={{ lideranca: leadership.leadership_id }}>
          <ExternalLink className="h-4 w-4" />
          Abrir todos na base ({leadership.linked_supporters})
        </Link>
      </Button>

      {canUpdate && (
        <div className="space-y-4 rounded-lg border border-border/70 p-4">
          <h3 className="text-sm font-semibold">Dados da liderança</h3>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => onNameChange(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Região (metadado)</Label>
              <Input value={region} onChange={(e) => onRegionChange(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Meta de votos (associados)</Label>
              <Input
                type="number"
                min={0}
                value={votes}
                onChange={(e) => onVotesChange(e.target.value)}
              />
            </div>
            <Button disabled={!name.trim() || savePending} onClick={onSave}>
              {savePending ? "Salvando…" : "Salvar liderança"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
