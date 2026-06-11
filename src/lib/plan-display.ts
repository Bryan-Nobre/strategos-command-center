import { TENANT_PLAN_LABELS, type TenantPlan } from "@/types/tenant";
import type { Enums } from "@/types/supabase";

export type PlanHighlightStyle = "blue" | "purple";

export type PlanDefinitionRow = {
  plan: Enums<"tenant_plan">;
  maxSupporters: number | null;
  maxTeamMembers: number | null;
  maxRegions: number | null;
  exportsEnabled: boolean;
  pollsEnabled: boolean;
  tagline: string | null;
  priceLabel: string;
  isHighlighted: boolean;
  highlightStyle: PlanHighlightStyle;
  /** Exibir na vitrine comercial (Configurações / comparativo). */
  isListed: boolean;
};

export type PlanPriceDisplay = {
  main: string;
  suffix: string | null;
};

const PRICE_WITHOUT_SUFFIX =
  /^(grátis|gratis|sob consulta|personalizado|a combinar|sob medida)/i;

/** Formata o preço configurado no admin para exibição nos cards. */
export function formatPlanPriceDisplay(priceLabel: string): PlanPriceDisplay {
  const main = priceLabel.trim();
  if (!main) return { main: "", suffix: null };
  if (PRICE_WITHOUT_SUFFIX.test(main)) {
    return { main, suffix: null };
  }
  return { main, suffix: "/ mês" };
}

export function filterListedPlans<T extends Pick<PlanDefinitionRow, "isListed">>(plans: T[]): T[] {
  return plans.filter((p) => p.isListed);
}

function formatNumericLimit(value: number | null, unit: string): string {
  if (value === null) return `${unit} ilimitados`;
  return `Até ${value.toLocaleString("pt-BR")} ${unit}`;
}

export function buildPlanFeatureList(row: PlanDefinitionRow): string[] {
  const features = [
    formatNumericLimit(row.maxSupporters, "apoiadores"),
    formatNumericLimit(row.maxTeamMembers, "membros na equipe"),
    formatNumericLimit(row.maxRegions, "regiões (bairros)"),
    row.exportsEnabled ? "Exportação CSV incluída" : "Sem exportação CSV",
    row.pollsEnabled ? "Pesquisas eleitorais" : "Pesquisas indisponíveis",
  ];
  return features;
}

export function planDisplayName(plan: TenantPlan): string {
  return TENANT_PLAN_LABELS[plan];
}

export function planCardClassName(row: PlanDefinitionRow, selected: boolean): string {
  const base = "admin-plan-card";
  if (row.isHighlighted) {
    return `${base} admin-plan-card--highlight admin-plan-card--${row.highlightStyle}${
      selected ? " admin-plan-card--selected" : ""
    }`;
  }
  return `${base}${selected ? " admin-plan-card--selected" : ""}`;
}
