import { Link } from "@tanstack/react-router";
import { ExternalLink, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadershipVoteProgress } from "@/components/liderancas/LeadershipVoteProgress";
import {
  LEADERSHIP_POINTS_HELP,
  formatLeadershipPoints,
} from "@/lib/leadership-metrics-copy";
import { leadershipTotalPoints } from "@/lib/leadership-points";
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
  const totalPoints = leadershipTotalPoints(leadership);

  return (
    <div className="space-y-5">
      <LeadershipVoteProgress
        points={totalPoints}
        target={leadership.estimated_votes}
        landpagePoints={leadership.pledged_votes}
      />

      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4" aria-hidden />
        <AlertTitle className="text-sm">
          {LEADERSHIP_POINTS_HELP.title}:{" "}
          <span className="tabular-nums">{formatLeadershipPoints(totalPoints)}</span>
        </AlertTitle>
        <AlertDescription className="space-y-1 text-xs leading-relaxed">
          <p>{LEADERSHIP_POINTS_HELP.short}</p>
          <p className="text-muted-foreground">{LEADERSHIP_POINTS_HELP.howItWorks}</p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-card px-3 py-2.5 text-center shadow-sm">
          <p className="text-xl font-semibold tabular-nums">{leadership.linked_supporters}</p>
          <p className="mt-1 text-xs font-medium">Apoiadores</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Pessoas na rede</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2.5 text-center shadow-sm">
          <p className="text-xl font-semibold tabular-nums">{leadership.pledge_links_count}</p>
          <p className="mt-1 text-xs font-medium">Landpage</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Com apoio a chapa</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2.5 text-center shadow-sm">
          <p className="text-xl font-semibold tabular-nums">{leadership.manual_links_count}</p>
          <p className="mt-1 text-xs font-medium">Manual no CRM</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">1 ponto cada (padrão)</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2.5 text-center shadow-sm">
          <p className="text-xl font-semibold tabular-nums">{leadership.weekly_growth}</p>
          <p className="mt-1 text-xs font-medium">+7 dias</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Novos na rede</p>
        </div>
      </div>

      {leadership.landing_only_network && leadership.linked_supporters > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Rede depende apenas de apoios na landpage (sem vínculos manuais no CRM).
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
              <Label>Meta (pontos / associados estimados)</Label>
              <p className="text-[11px] text-muted-foreground">
                Alvo usado na barra de progresso acima. Ex.: meta de 500 associados = 500 pontos.
              </p>
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
