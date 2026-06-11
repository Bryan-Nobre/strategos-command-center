/** Textos de apoio para pontuação de liderança (UX; cálculo real no backend/RLS). */

export const LEADERSHIP_POINTS_HELP = {
  title: "Pontos totais",
  short:
    "Cada apoiador na rede vale 1 ponto. O total é a quantidade de pessoas vinculadas a esta liderança — não é projeção oficial de votos.",
  howItWorks:
    "Landpage ou CRM manual: importa quem é a pessoa, não o peso da chapa. Marcar duas chapas da mesma liderança ainda conta 1 ponto para essa liderança.",
  supporterPoints: "Esta pessoa conta 1 ponto nesta liderança.",
  chapaHelp:
    "Chapas organizam o apoio na landpage. Cada apoiador que marcar qualquer chapa desta liderança soma 1 ponto no total.",
  metaProgress:
    "Quantos apoiadores a rede já tem em relação à meta definida para a liderança (1 apoiador = 1 ponto).",
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
    description: "Pessoas na rede — cada uma vale 1 ponto no total.",
  },
  {
    id: "landpage",
    label: "Landpage",
    description: "Apoiadores que entraram pela página pública (com apoio a chapa).",
  },
  {
    id: "manual",
    label: "Manual no CRM",
    description: "Vínculos feitos pela equipe no sistema.",
  },
  {
    id: "growth",
    label: "+7 dias",
    description: "Novos apoiadores na rede nos últimos 7 dias.",
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

/** Exibição fixa: 1 ponto por apoiador na rede. */
export const SUPPORTER_NETWORK_POINTS_LABEL = "1 ponto";
