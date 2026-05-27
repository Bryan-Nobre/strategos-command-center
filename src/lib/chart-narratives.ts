type GrowthPoint = { mes: string; apoiadores: number };
type IntentionPoint = { candidato: string; valor: number };
type ApprovalPoint = { bairro: string; aprovacao: number };

export function narrativeGrowth(data: GrowthPoint[]): string | null {
  if (data.length < 2) return null;
  const sorted = [...data];
  const last = sorted[sorted.length - 1]?.apoiadores ?? 0;
  const prev = sorted[sorted.length - 2]?.apoiadores ?? 0;
  if (prev === 0)
    return last > 0 ? "Base de apoiadores em expansão no último período registrado." : null;
  const pct = Math.round(((last - prev) / prev) * 100);
  if (pct > 0)
    return `Apoio cresceu ${pct}% no último mês registrado (${sorted[sorted.length - 1]?.mes}).`;
  if (pct < 0)
    return `Queda de ${Math.abs(pct)}% no último mês registrado — vale reforçar captação.`;
  return "Estabilidade no último mês registrado.";
}

export function narrativeIntention(data: IntentionPoint[]): string | null {
  if (!data.length) return null;
  const top = [...data].sort((a, b) => b.valor - a.valor)[0];
  if (!top) return null;
  return `${top.candidato} lidera a intenção de voto na última pesquisa registrada (${top.valor}%).`;
}

export function narrativeApproval(data: ApprovalPoint[]): string | null {
  if (!data.length) return null;
  const top = [...data].sort((a, b) => b.aprovacao - a.aprovacao)[0];
  if (!top) return null;
  return `${top.bairro} apresenta o maior índice de aprovação (${top.aprovacao}%).`;
}
