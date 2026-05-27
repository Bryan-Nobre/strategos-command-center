import type { ManualGoalConfig, TerritoryInsight, WeeklyGoal } from "@/services/dashboard";
import {
  greetingForHour,
  isIsoDayBetween,
  lastNDaysRange,
  pctChange,
  startOfLocalDay,
  toIsoDay,
} from "@/lib/dashboard-dates";

type SupporterRow = {
  neighborhood: string | null;
  status: string;
  support_level: string;
  created_at: string | null;
};

type DemandRow = {
  neighborhood: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  assigned_to: string | null;
};

export type TerritoryRiskLevel = "critico" | "atencao" | "promissor";

export type EnrichedTerritory = TerritoryInsight & {
  displayScore: number;
  riskLevel: TerritoryRiskLevel;
};

export type OperationalAlert = {
  id: string;
  severity: "alta" | "media";
  title: string;
  description: string;
  suggestion: string;
  actionLabel: string;
  actionTo: string;
  actionSearch?: Record<string, string | boolean>;
};

export type QuickPill = {
  id: string;
  label: string;
  tone: "positive" | "warning" | "neutral";
};

export type StripItem = {
  id: string;
  label: string;
  tone: "warning" | "success" | "neutral";
};

export type NextAction = {
  id: string;
  label: string;
  href: string;
  search?: Record<string, string | boolean>;
};

export type KpiContext = {
  last7: number;
  deltaPct: number | null;
  sublabel: string;
};

export type DailyMetric = {
  label: string;
  value: number;
};

export type OperationalBrief = {
  pills: QuickPill[];
  strip: StripItem[];
  dailySummary: DailyMetric[];
  nextActions: NextAction[];
  briefingParts: { alerts: number; criticalTerritories: number };
  kpi: {
    supporters: KpiContext;
    strongSupport: KpiContext;
    leaderships: KpiContext;
    openDemands: KpiContext;
  };
  unassignedOpenDemands: number;
};

export function enrichTerritories(rows: TerritoryInsight[]): EnrichedTerritory[] {
  if (!rows.length) return [];
  const sorted = [...rows].sort((a, b) => a.score - b.score);
  const min = sorted[0]!.score;
  const max = sorted[sorted.length - 1]!.score;
  const span = Math.max(max - min, 1);

  return rows.map((row) => {
    const displayScore = Math.round(((row.score - min) / span) * 100);
    let riskLevel: TerritoryRiskLevel = "atencao";
    if (displayScore <= 33) riskLevel = "critico";
    else if (displayScore >= 67) riskLevel = "promissor";
    return { ...row, displayScore, riskLevel };
  });
}

export function buildOperationalAlerts(critical: EnrichedTerritory[]): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];

  for (const t of critical) {
    if (t.oppositionPct >= 25) {
      alerts.push({
        id: `opp-${t.neighborhood}`,
        severity: "alta",
        title: `Oposição alta em ${t.neighborhood}`,
        description: `${t.oppositionPct}% da base local está em oposição.`,
        suggestion: "Mapear lideranças locais e intensificar diálogo porta a porta.",
        actionLabel: "Ver eleitores",
        actionTo: "/eleitores",
        actionSearch: { bairro: t.neighborhood },
      });
    }
    if (t.openDemands >= 8) {
      alerts.push({
        id: `dem-${t.neighborhood}`,
        severity: "media",
        title: `Acúmulo de demandas em ${t.neighborhood}`,
        description: `${t.openDemands} demandas abertas aguardando encaminhamento.`,
        suggestion: "Distribuir responsáveis e priorizar resolução nas próximas 48h.",
        actionLabel: "Abrir demandas",
        actionTo: "/demandas",
        actionSearch: { bairro: t.neighborhood },
      });
    }
    if (t.undecidedPct >= 35) {
      alerts.push({
        id: `und-${t.neighborhood}`,
        severity: "media",
        title: `Indecisão crítica em ${t.neighborhood}`,
        description: `${t.undecidedPct}% da base local ainda está indecisa.`,
        suggestion: "Criar ação de rua ou reforçar liderança local no território.",
        actionLabel: "Abrir território",
        actionTo: "/eleitores",
        actionSearch: { bairro: t.neighborhood },
      });
    }
  }

  return alerts.slice(0, 8);
}

export function buildOperationalBrief(
  supporters: SupporterRow[],
  demands: DemandRow[],
  alerts: OperationalAlert[],
  criticalCount: number,
  criticalTop: EnrichedTerritory | undefined,
  promisingTop: EnrichedTerritory | undefined,
  weeklyGoals: WeeklyGoal[],
  unassignedOpen: number,
): OperationalBrief {
  const week = lastNDaysRange(7);
  const today = toIsoDay(startOfLocalDay());

  const countSupportersInRange = (start: string, end: string) =>
    supporters.filter((s) => isIsoDayBetween(s.created_at, start, end)).length;

  const countStrongInRange = (start: string, end: string) =>
    supporters.filter(
      (s) => s.support_level === "forte" && isIsoDayBetween(s.created_at, start, end),
    ).length;

  const newSupporters7 = countSupportersInRange(week.start, week.end);
  const prevSupporters7 = countSupportersInRange(week.prevStart, week.prevEnd);
  const newStrong7 = countStrongInRange(week.start, week.end);
  const prevStrong7 = countStrongInRange(week.prevStart, week.prevEnd);

  const openDemands = demands.filter((d) => d.status !== "resolvido");
  const newOpen7 = openDemands.filter((d) =>
    isIsoDayBetween(d.created_at, week.start, week.end),
  ).length;
  const prevOpen7 = openDemands.filter((d) =>
    isIsoDayBetween(d.created_at, week.prevStart, week.prevEnd),
  ).length;

  const supportersToday = supporters.filter((s) => s.created_at?.slice(0, 10) === today).length;
  const demandsToday = demands.filter((d) => d.created_at?.slice(0, 10) === today).length;
  const resolvedToday = demands.filter(
    (d) => d.status === "resolvido" && d.updated_at?.slice(0, 10) === today,
  ).length;

  const leadershipActive = supporters.filter((s) => s.status === "lideranca").length;

  const pills: QuickPill[] = [];
  if (newSupporters7 > 0) {
    pills.push({
      id: "sup-week",
      label: `+${newSupporters7} novos apoiadores nos últimos 7 dias`,
      tone: "positive",
    });
  }
  if (unassignedOpen > 0) {
    pills.push({
      id: "dem-unassigned",
      label: `${unassignedOpen} demanda${unassignedOpen > 1 ? "s" : ""} sem responsável`,
      tone: "warning",
    });
  }
  if (criticalCount > 0) {
    const top =
      criticalCount === 1 ? "1 território crítico" : `${criticalCount} territórios críticos`;
    pills.push({ id: "terr", label: `${top} hoje`, tone: "warning" });
  }
  if (promisingTop && promisingTop.displayScore >= 67) {
    pills.push({
      id: "prom",
      label: `Destaque positivo em ${promisingTop.neighborhood}`,
      tone: "positive",
    });
  }

  const strip: StripItem[] = [];
  if (criticalCount > 0) {
    strip.push({
      id: "strip-crit",
      label: `${criticalCount} território${criticalCount > 1 ? "s" : ""} em risco`,
      tone: "warning",
    });
  }
  if (unassignedOpen > 0) {
    strip.push({
      id: "strip-dem",
      label: `${unassignedOpen} demanda${unassignedOpen > 1 ? "s" : ""} sem responsável`,
      tone: "warning",
    });
  }
  if (promisingTop) {
    strip.push({
      id: "strip-prom",
      label: `Crescimento de apoio em ${promisingTop.neighborhood}`,
      tone: "success",
    });
  }

  const nextActions: NextAction[] = [];
  if (unassignedOpen > 0) {
    nextActions.push({
      id: "act-dem",
      label: "Atribuir responsáveis às demandas abertas",
      href: "/demandas",
      search: { semResponsavel: "1" },
    });
  }
  const overdueGoals = weeklyGoals.filter((g) => g.status === "atrasado");
  if (overdueGoals.length > 0) {
    nextActions.push({
      id: "act-goals",
      label: `Revisar meta atrasada: ${overdueGoals[0]!.name}`,
      href: "/configuracoes",
    });
  }
  if (criticalCount > 0 && criticalTop) {
    nextActions.push({
      id: "act-terr",
      label: `Priorizar território ${criticalTop.neighborhood}`,
      href: "/eleitores",
      search: { bairro: criticalTop.neighborhood },
    });
  }
  if (nextActions.length < 3) {
    nextActions.push({
      id: "act-polls",
      label: "Atualizar pesquisa de intenção de voto",
      href: "/pesquisas",
    });
  }

  return {
    pills: pills.slice(0, 4),
    strip: strip.slice(0, 4),
    dailySummary: [
      { label: "Novos apoiadores hoje", value: supportersToday },
      { label: "Demandas abertas hoje", value: demandsToday },
      { label: "Demandas resolvidas hoje", value: resolvedToday },
      { label: "Lideranças na base", value: leadershipActive },
    ],
    nextActions: nextActions.slice(0, 4),
    briefingParts: { alerts: alerts.length, criticalTerritories: criticalCount },
    kpi: {
      supporters: {
        last7: newSupporters7,
        deltaPct: pctChange(newSupporters7, prevSupporters7),
        sublabel: `+${newSupporters7} nos últimos 7 dias`,
      },
      strongSupport: {
        last7: newStrong7,
        deltaPct: pctChange(newStrong7, prevStrong7),
        sublabel: `${newStrong7} novos apoios fortes (7d)`,
      },
      leaderships: {
        last7: leadershipActive,
        deltaPct: null,
        sublabel: "Total na base",
      },
      openDemands: {
        last7: newOpen7,
        deltaPct: pctChange(newOpen7, prevOpen7),
        sublabel: `${openDemands.length} abertas no total`,
      },
    },
    unassignedOpenDemands: unassignedOpen,
  };
}

export function buildBriefingSentence(parts: {
  alerts: number;
  criticalTerritories: number;
}): string {
  const bits: string[] = [];
  if (parts.alerts > 0) {
    bits.push(
      `${parts.alerts} alerta${parts.alerts > 1 ? "s" : ""} operacional${parts.alerts > 1 ? "is" : ""}`,
    );
  }
  if (parts.criticalTerritories > 0) {
    bits.push(
      `${parts.criticalTerritories} território${parts.criticalTerritories > 1 ? "s" : ""} crítico${parts.criticalTerritories > 1 ? "s" : ""}`,
    );
  }
  if (!bits.length) return "Nenhum alerta crítico no momento — operação estável.";
  return `Sua campanha possui ${bits.join(" e ")} hoje.`;
}

export function greetingLabel(firstName: string | null | undefined): string {
  const hour = new Date().getHours();
  const base = greetingForHour(hour);
  const name = firstName?.trim().split(/\s+/)[0];
  return name ? `${base}, ${name}.` : `${base}.`;
}
