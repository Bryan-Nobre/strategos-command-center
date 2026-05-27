import type { ReportsSummary } from "@/services/reports";

/**
 * Estrutura preparada para PDF executivo (implementação futura).
 * Segurança real: geração server-side com template auditável.
 */
export type ExecutivePdfPayload = {
  generatedAt: string;
  campaignName: string;
  periodLabel: string;
  summary: ReportsSummary["summary"];
  pulse: ReportsSummary["pulse"];
  criticalTerritories: ReportsSummary["territories"]["critical"];
  funnel: ReportsSummary["funnel"];
};

export async function exportExecutivePdf(_payload: ExecutivePdfPayload): Promise<void> {
  throw new Error("Exportação PDF em desenvolvimento. Use o relatório consolidado CSV por enquanto.");
}
