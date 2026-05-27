const STORAGE_KEY = "strategos-reports-export-log";

export type ReportsExportLogEntry = {
  id: string;
  type: string;
  label: string;
  rows: number;
  at: string;
};

export function readExportLog(tenantId: string): ReportsExportLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, ReportsExportLogEntry[]>) : {};
    return all[tenantId] ?? [];
  } catch {
    return [];
  }
}

export function appendExportLog(tenantId: string, entry: Omit<ReportsExportLogEntry, "id" | "at">) {
  if (typeof window === "undefined") return;
  const log = readExportLog(tenantId);
  const next: ReportsExportLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, ReportsExportLogEntry[]>) : {};
    all[tenantId] = [next, ...log].slice(0, 12);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
}
