import type {
  EnrichedTerritory,
  NextAction,
  OperationalAlert,
  QuickPill,
} from "@/services/dashboard-intelligence";

export type DashboardPriorityItem = {
  id: string;
  kind: "alert" | "action";
  severity?: OperationalAlert["severity"];
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
  actionSearch?: Record<string, string | boolean>;
};

export function buildDailyPriorities(
  alerts: OperationalAlert[],
  actions: NextAction[],
  max = 3,
): DashboardPriorityItem[] {
  const items: DashboardPriorityItem[] = [];

  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "alta" ? -1 : 1;
  });

  for (const alert of sortedAlerts) {
    if (items.length >= max) break;
    items.push({
      id: `alert-${alert.id}`,
      kind: "alert",
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      actionLabel: alert.actionLabel,
      actionTo: alert.actionTo,
      actionSearch: alert.actionSearch,
    });
  }

  for (const action of actions) {
    if (items.length >= max) break;
    if (items.some((i) => i.actionTo === action.href && i.title === action.label)) continue;
    items.push({
      id: `action-${action.id}`,
      kind: "action",
      title: action.label,
      description: "Ação recomendada pelo sistema para destravar a operação.",
      actionLabel: "Executar",
      actionTo: action.href,
      actionSearch: action.search,
    });
  }

  return items.slice(0, max);
}

export type HeroCta = {
  label: string;
  to: string;
  search?: Record<string, string | boolean>;
  variant: "primary" | "secondary";
};

export function resolveHeroCtas(
  critical: EnrichedTerritory[],
  promising: EnrichedTerritory[],
  alerts: OperationalAlert[],
  actions: NextAction[],
  canViewEleitores: boolean,
): { primary: HeroCta; secondary: HeroCta } {
  const topCritical = critical[0];
  const topPromising = promising[0];
  const topAlert = alerts[0];
  const topAction = actions[0];

  if (topCritical && canViewEleitores) {
    return {
      primary: {
        label: `Ver ${topCritical.neighborhood}`,
        to: "/eleitores",
        search: { bairro: topCritical.neighborhood },
        variant: "primary",
      },
      secondary: {
        label: topAction?.label ?? "Abrir demandas",
        to: topAction?.href ?? "/demandas",
        search: topAction?.search,
        variant: "secondary",
      },
    };
  }

  if (topAlert) {
    return {
      primary: {
        label: topAlert.actionLabel,
        to: topAlert.actionTo,
        search: topAlert.actionSearch,
        variant: "primary",
      },
      secondary: {
        label: "Ver oportunidades",
        to: "/eleitores",
        search: topPromising ? { bairro: topPromising.neighborhood } : undefined,
        variant: "secondary",
      },
    };
  }

  if (topPromising && canViewEleitores) {
    return {
      primary: {
        label: `Acelerar ${topPromising.neighborhood}`,
        to: "/eleitores",
        search: { bairro: topPromising.neighborhood },
        variant: "primary",
      },
      secondary: {
        label: topAction?.label ?? "Abrir operação",
        to: topAction?.href ?? "/demandas",
        search: topAction?.search,
        variant: "secondary",
      },
    };
  }

  return {
    primary: {
      label: topAction?.label ?? "Abrir demandas",
      to: topAction?.href ?? "/demandas",
      search: topAction?.search,
      variant: "primary",
    },
    secondary: {
      label: "Ver apoiadores",
      to: "/eleitores",
      variant: "secondary",
    },
  };
}

export function pickHeroHighlight(
  critical: EnrichedTerritory[],
  promising: EnrichedTerritory[],
  alerts: OperationalAlert[],
): { alertLine?: string; opportunityLine?: string } {
  const topCritical = critical[0];
  const topPromising = promising[0];
  const topAlert = alerts[0];

  return {
    alertLine: topAlert?.title ?? (topCritical ? `Atenção em ${topCritical.neighborhood}` : undefined),
    opportunityLine: topPromising
      ? `Oportunidade em ${topPromising.neighborhood} (score ${topPromising.displayScore})`
      : undefined,
  };
}

export function pillsToBadges(pills: QuickPill[], max = 3): QuickPill[] {
  return pills.slice(0, max);
}
