import { useEffect, useRef, useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useManualGoalsConfig, useSaveManualGoalsConfig } from "@/hooks/use-dashboard";
import type { ManualGoalConfig, ManualGoalMetric } from "@/services/dashboard";
import { GOAL_METRIC_HINTS, GOAL_METRIC_LABELS } from "@/lib/goal-metrics";
import { generateId } from "@/lib/generate-id";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function newGoalTemplate(index: number): ManualGoalConfig {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 6);
  return {
    id: generateId(),
    name: `Meta ${index + 1}`,
    metric: "new_supporters",
    startDate: today.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    target: 10,
  };
}

export function GoalsSettingsSection({
  tenantId,
  canEdit,
}: {
  tenantId: string;
  canEdit: boolean;
}) {
  const { data: goalsConfig, isLoading, isError, error, refetch } = useManualGoalsConfig(tenantId);
  const saveMutation = useSaveManualGoalsConfig(tenantId);
  const [goals, setGoals] = useState<ManualGoalConfig[]>([]);
  const dirtyRef = useRef(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isLoading || dirtyRef.current) return;
    setGoals(goalsConfig ?? []);
  }, [goalsConfig, isLoading]);

  function markDirty(updater: (prev: ManualGoalConfig[]) => ManualGoalConfig[]) {
    dirtyRef.current = true;
    setIsDirty(true);
    setGoals(updater);
  }

  function addGoal() {
    markDirty((prev) => [...prev, newGoalTemplate(prev.length)]);
  }

  function handleSave() {
    saveMutation.mutate(goals, {
      onSuccess: () => {
        dirtyRef.current = false;
        setIsDirty(false);
      },
    });
  }

  return (
    <div className="space-y-4">
      <Card className="settings-panel shadow-elegant">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Metas da campanha
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl">
              Defina objetivos por período. Na visão geral do Dashboard, cada meta usa sua própria
              métrica: cadastros pela landing ou demandas concluídas — sem misturar os dois.
            </CardDescription>
          </div>
          {canEdit && (
            <Button type="button" variant="outline" size="sm" onClick={addGoal}>
              <Plus className="mr-2 h-4 w-4" />
              Nova meta
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isError && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar as metas</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-2">
                <span>
                  {error instanceof Error ? error.message : "Erro desconhecido. Tente novamente."}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                  Tentar de novo
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isLoading && !isError && (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando metas…</p>
          )}

          {!isLoading && !isError && goals.length === 0 && (
            <div className="settings-goals-empty rounded-xl border border-dashed p-8 text-center">
              <Target className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 font-medium">Nenhuma meta configurada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie a primeira meta para acompanhar captação ou operação.
              </p>
              {canEdit && (
                <Button type="button" className="mt-4" size="sm" onClick={addGoal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar meta
                </Button>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {goals.map((goal, idx) => (
              <Card
                key={goal.id}
                className={cn(
                  "settings-goal-card border-border/80 bg-card/80",
                  isDirty && "ring-1 ring-primary/10",
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meta {idx + 1}</CardTitle>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => markDirty((prev) => prev.filter((g) => g.id !== goal.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid gap-2">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      value={goal.name}
                      disabled={!canEdit}
                      onChange={(e) =>
                        markDirty((prev) =>
                          prev.map((g) =>
                            g.id === goal.id ? { ...g, name: e.target.value } : g,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Métrica</Label>
                    <Select
                      value={goal.metric}
                      disabled={!canEdit}
                      onValueChange={(value) =>
                        markDirty((prev) =>
                          prev.map((g) =>
                            g.id === goal.id ? { ...g, metric: value as ManualGoalMetric } : g,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(GOAL_METRIC_LABELS) as ManualGoalMetric[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {GOAL_METRIC_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      {GOAL_METRIC_HINTS[goal.metric]}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="date"
                        disabled={!canEdit}
                        value={goal.startDate}
                        onChange={(e) =>
                          markDirty((prev) =>
                            prev.map((g) =>
                              g.id === goal.id ? { ...g, startDate: e.target.value } : g,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="date"
                        disabled={!canEdit}
                        value={goal.endDate}
                        onChange={(e) =>
                          markDirty((prev) =>
                            prev.map((g) =>
                              g.id === goal.id ? { ...g, endDate: e.target.value } : g,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Quantidade alvo</Label>
                    <Input
                      type="number"
                      min={0}
                      disabled={!canEdit}
                      value={goal.target}
                      onChange={(e) =>
                        markDirty((prev) =>
                          prev.map((g) =>
                            g.id === goal.id
                              ? { ...g, target: Math.max(0, Number(e.target.value) || 0) }
                              : g,
                          ),
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {canEdit && goals.length > 0 && (
            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <p className="text-xs text-muted-foreground">
                {isDirty ? "Alterações não salvas" : "Todas as metas estão sincronizadas"}
              </p>
              <Button
                type="button"
                disabled={saveMutation.isPending}
                onClick={handleSave}
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar metas"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
