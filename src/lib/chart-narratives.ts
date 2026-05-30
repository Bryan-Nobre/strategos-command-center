type GrowthPoint = { label: string; apoiadores: number };
type IntentionPoint = { candidato: string; valor: number };
type ApprovalPoint = { bairro: string; aprovacao: number };

export function narrativeGrowth(data: GrowthPoint[]): string | null {
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.apoiadores, 0);
  if (total === 0) return "Nenhum novo cadastro no período selecionado.";

  const last = data[data.length - 1]?.apoiadores ?? 0;
  const prev = data.length >= 2 ? (data[data.length - 2]?.apoiadores ?? 0) : 0;

  if (data.length < 2) {
    return last > 0
      ? `${last} ${last === 1 ? "cadastro" : "cadastros"} no único dia do intervalo.`
      : null;
  }

  if (prev === 0) {
    return last > 0
      ? `Último dia: ${last} ${last === 1 ? "novo apoiador" : "novos apoiadores"} (dia anterior sem cadastros).`
      : `Total de ${total} cadastros no período; último dia sem entradas.`;
  }

  const pct = Math.round(((last - prev) / prev) * 100);
  if (pct > 0) {
    return `Último dia: ${last} cadastros (+${pct}% vs. dia anterior). Total no período: ${total}.`;
  }
  if (pct < 0) {
    return `Último dia: ${last} cadastros (${pct}% vs. dia anterior). Total no período: ${total}.`;
  }
  return `Último dia estável (${last} cadastros). Total no período: ${total}.`;
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
