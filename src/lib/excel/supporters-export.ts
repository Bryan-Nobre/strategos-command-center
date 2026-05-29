import {
  SUPPORTER_SOURCE_LABELS,
  SUPPORTER_STATUS_LABELS,
  SUPPORT_LEVEL_LABELS,
} from "@/types/domain";
import type { SupporterListItem } from "@/lib/eleitores-filter";

const HEADER_FILL = "FF07723D";
const HEADER_FONT = "FFFFFFFF";
const ALT_ROW_FILL = "FFF8FAFC";

export type SupporterExcelExportOptions = {
  filename: string;
  rows: SupporterListItem[];
  leadershipNames: Map<string, string>;
  sheetTitle?: string;
};

export async function downloadSupportersExcel({
  filename,
  rows,
  leadershipNames,
  sheetTitle = "Apoiadores",
}: SupporterExcelExportOptions): Promise<void> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Strategos CRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetTitle, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Nome", key: "name", width: 28 },
    { header: "Telefone", key: "phone", width: 16 },
    { header: "Bairro", key: "neighborhood", width: 18 },
    { header: "Cidade", key: "city", width: 16 },
    { header: "Zona", key: "electoral_zone", width: 10 },
    { header: "Seção", key: "electoral_section", width: 10 },
    { header: "Status político", key: "status", width: 14 },
    { header: "Grau de apoio", key: "support_level", width: 14 },
    { header: "Origem", key: "source", width: 12 },
    { header: "Interesse (landing)", key: "interest", width: 24 },
    { header: "Tags", key: "tags", width: 20 },
    { header: "Liderança", key: "leadership", width: 22 },
    { header: "Cadastro", key: "created_at", width: 18 },
    { header: "Observações", key: "notes", width: 32 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_FONT }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF055A30" } },
    };
  });

  rows.forEach((r, index) => {
    const row = sheet.addRow({
      name: r.name,
      phone: r.phone ?? "",
      neighborhood: r.neighborhood ?? "",
      city: r.city ?? "",
      electoral_zone: r.electoral_zone ?? "",
      electoral_section: r.electoral_section ?? "",
      status: SUPPORTER_STATUS_LABELS[r.status] ?? r.status,
      support_level: SUPPORT_LEVEL_LABELS[r.support_level] ?? r.support_level,
      source: SUPPORTER_SOURCE_LABELS[r.source] ?? r.source,
      interest: r.interest ?? "",
      tags: (r.tags ?? []).join("; "),
      leadership: r.leadership_id ? leadershipNames.get(r.leadership_id) ?? "" : "",
      created_at: new Date(r.created_at),
      notes: r.notes ?? "",
    });

    if (index % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALT_ROW_FILL } };
      });
    }

    row.getCell("created_at").numFmt = "dd/mm/yyyy hh:mm";
    row.getCell("phone").alignment = { horizontal: "left" };
    row.alignment = { vertical: "top", wrapText: true };
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildExcelFilename(slug: string, label: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safe = slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "campanha";
  return `${safe}-${label}-${date}.xlsx`;
}
