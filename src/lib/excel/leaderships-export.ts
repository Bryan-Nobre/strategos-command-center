export async function downloadLeadershipsExcel({
  filename,
  rows,
}: {
  filename: string;
  rows: {
    name: string;
    region: string | null;
    estimated_votes: number;
    pledged_votes: number;
    apoiadores: number;
    chapa_count: number;
    political_strength_score: number;
    primary_supporters: number;
    secondary_supporters: number;
    weekly_growth: number;
    top_neighborhood: string | null;
  }[];
}): Promise<void> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Lideranças", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Força (score)", key: "score", width: 12 },
    { header: "Liderança", key: "name", width: 28 },
    { header: "Região", key: "region", width: 18 },
    { header: "Primários", key: "primary", width: 10 },
    { header: "Secundários", key: "secondary", width: 12 },
    { header: "Cresc. 7d", key: "growth", width: 10 },
    { header: "Top bairro", key: "neighborhood", width: 18 },
    { header: "Na rede", key: "supporters", width: 10 },
    { header: "Apoios landing", key: "pledged", width: 14 },
    { header: "Meta", key: "target", width: 10 },
    { header: "Chapas", key: "chapas", width: 10 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF07723D" } };
  });

  rows.forEach((r) => {
    sheet.addRow({
      score: r.political_strength_score,
      name: r.name,
      region: r.region ?? "",
      primary: r.primary_supporters,
      secondary: r.secondary_supporters,
      growth: r.weekly_growth,
      neighborhood: r.top_neighborhood ?? "",
      supporters: r.apoiadores,
      pledged: r.pledged_votes,
      target: r.estimated_votes,
      chapas: r.chapa_count,
    });
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 11 } };

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

export function buildLeadershipExcelFilename(slug: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safe = slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "campanha";
  return `${safe}-liderancas-${date}.xlsx`;
}
