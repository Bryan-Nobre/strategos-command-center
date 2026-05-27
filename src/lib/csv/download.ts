export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function csvEscape(value: string | null | undefined): string {
  const s = value ?? "";
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildCsvFilename(slug: string, label: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safe = slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "campanha";
  return `${safe}-${label}-${date}.csv`;
}
