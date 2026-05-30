import type { ManualGoalMetric } from "@/services/dashboard";

/** Rótulos alinhados à regra de negócio (landing vs demandas concluídas). */
export const GOAL_METRIC_LABELS: Record<ManualGoalMetric, string> = {
  new_supporters: "Captação na landing (eleitores)",
  resolved_demands: "Demandas concluídas",
};

export const GOAL_METRIC_HINTS: Record<ManualGoalMetric, string> = {
  new_supporters: "Conta somente cadastros com origem na página pública da campanha.",
  resolved_demands: "Conta demandas com status resolvido no período da meta.",
};

export const GOAL_STATUS_LABELS = {
  no_ritmo: { label: "No ritmo", variant: "default" as const },
  risco: { label: "Em risco", variant: "outline" as const },
  atrasado: { label: "Atrasado", variant: "destructive" as const },
};
