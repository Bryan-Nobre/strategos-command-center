import { csvEscape } from "./download";
import { DEMAND_CATEGORY_LABELS } from "@/types/domain";

type SupporterRow = {
  name: string;
  phone: string | null;
  neighborhood: string | null;
  city: string | null;
  status: string;
  support_level: string;
};

type DemandRow = {
  title: string;
  category: string;
  status: string;
  neighborhood: string | null;
};

export function buildConsolidatedReportCsv(
  supporters: SupporterRow[],
  demands: DemandRow[],
): string {
  const sections: string[] = [];

  sections.push("=== APOIADORES ===");
  sections.push("nome,telefone,bairro,cidade,status,apoio");
  sections.push(
    ...supporters.map((r) =>
      [r.name, r.phone, r.neighborhood, r.city, r.status, r.support_level]
        .map((v) => csvEscape(v))
        .join(","),
    ),
  );

  sections.push("");
  sections.push("=== RESUMO DEMANDAS POR CATEGORIA ===");
  sections.push("categoria,quantidade");
  const byCategory = new Map<string, number>();
  for (const d of demands) {
    const label = DEMAND_CATEGORY_LABELS[d.category] ?? d.category;
    byCategory.set(label, (byCategory.get(label) ?? 0) + 1);
  }
  for (const [cat, count] of byCategory) {
    sections.push(`${csvEscape(cat)},${count}`);
  }

  sections.push("");
  sections.push("=== DEMANDAS (DETALHE) ===");
  sections.push("titulo,categoria,status,bairro");
  sections.push(
    ...demands.map((d) =>
      [d.title, DEMAND_CATEGORY_LABELS[d.category] ?? d.category, d.status, d.neighborhood]
        .map((v) => csvEscape(v))
        .join(","),
    ),
  );

  return sections.join("\n");
}
