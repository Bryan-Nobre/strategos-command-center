/** Textos de apoio para pontuação de liderança (UX; cálculo real no backend/RLS). */

export const LEADERSHIP_POINTS_HELP = {
  title: "Pontos totais",
  short:
    "Soma dos pontos de todos os apoiadores vinculados a esta liderança. Serve para comparar lideranças e acompanhar a meta — não é projeção oficial de votos.",
  howItWorks:
    "Cada apoiador na rede soma pontos: na landpage, o valor vem do peso da chapa que marcou; no CRM manual, cada vínculo vale 1 ponto por padrão (ou o peso definido no vínculo).",
  supporterPoints:
    "Pontos que esta pessoa soma nesta liderança (soma das chapas apoiadas ou peso do vínculo manual).",
  chapaWeight:
    "Quantos pontos cada apoiador soma na meta ao marcar esta chapa na landpage.",
  metaProgress:
    "Quanto a rede já somou em pontos em relação à meta de associados definida para a liderança.",
} as const;

/** @deprecated Use LEADERSHIP_POINTS_HELP */
export const LEADERSHIP_STRENGTH_SCORE_HELP = {
  title: LEADERSHIP_POINTS_HELP.title,
  short: LEADERSHIP_POINTS_HELP.short,
  formula: LEADERSHIP_POINTS_HELP.howItWorks,
} as const;

export const LEADERSHIP_NETWORK_KPI_COPY = [
  {
    id: "apoiadores",
    label: "Apoiadores",
    description: "Pessoas vinculadas a esta liderança na base da campanha.",
  },
  {
    id: "landpage",
    label: "Landpage",
    description: "Apoiadores que entraram pela página pública (com apoio a chapa).",
  },
  {
    id: "manual",
    label: "Manual no CRM",
    description: "Vínculos feitos pela equipe no sistema, sem apoio a chapa na landpage.",
  },
  {
    id: "growth",
    label: "+7 dias",
    description: "Novos apoiadores na rede nos últimos 7 dias (não altera o total de pontos sozinho).",
  },
] as const;

export function leadershipNetworkSegmentLabel(segmentId: string): string {
  const labels: Record<string, string> = {
    all: "Todos",
    with_pledge: "Landpage",
    crm_only: "Manual no CRM",
  };
  return labels[segmentId] ?? segmentId;
}

export function formatLeadershipPoints(value: number): string {
  return `${value} ${value === 1 ? "ponto" : "pontos"}`;
}
