import type { TerritoryInsight } from "@/services/dashboard";
import { greetingForHour } from "@/lib/dashboard-dates";

export type TerritoryRiskLevel = "critico" | "atencao" | "promissor";

export type EnrichedTerritory = TerritoryInsight & {
  territoryKey: string;
  territoryLabel: string;
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

export function greetingLabel(firstName: string | null | undefined): string {
  const hour = new Date().getHours();
  const base = greetingForHour(hour);
  const name = firstName?.trim().split(/\s+/)[0];
  return name ? `${base}, ${name}.` : `${base}.`;
}
