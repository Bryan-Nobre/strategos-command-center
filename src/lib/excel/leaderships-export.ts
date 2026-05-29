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
  }[];
}): Promise<void> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Lideranças", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Liderança", key: "name", width: 28 },
    { header: "Região", key: "region", width: 18 },
    { header: "Meta (associados)", key: "target", width: 16 },
    { header: "Apoios landing", key: "pledged", width: 14 },
    { header: "% meta", key: "pct", width: 10 },
    { header: "Apoiadores CRM", key: "supporters", width: 14 },
    { header: "Chapas", key: "chapas", width: 10 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF07723D" } };
  });

  rows.forEach((r) => {
    const pct =
      r.estimated_votes > 0 ? Math.round((r.pledged_votes / r.estimated_votes) * 100) : 0;
    sheet.addRow({
      name: r.name,
      region: r.region ?? "",
      target: r.estimated_votes,
      pledged: r.pledged_votes,
      pct: r.estimated_votes > 0 ? `${pct}%` : "—",
      supporters: r.apoiadores,
      chapas: r.chapa_count,
    });
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 7 } };

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
