import { createClient } from "@/lib/supabase/client";
import { buildConsolidatedReportCsv } from "@/lib/csv/reports-csv";
import { supportersToCsv } from "@/lib/csv/supporters-csv";
import { csvEscape } from "@/lib/csv/download";
import { DEMAND_CATEGORY_LABELS } from "@/types/domain";
import type { ReportsQueryParams } from "@/services/reports";

type SupporterFilters = Pick<
  ReportsQueryParams,
  "neighborhood" | "city" | "source" | "status" | "supportLevel" | "leadershipId"
>;

export async function fetchSupportersForExport(tenantId: string, f: SupporterFilters) {
  const supabase = createClient();
  let query = supabase
    .from("supporters")
    .select("name, phone, neighborhood, city, status, support_level, tags, leadership_id, source, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (f.neighborhood) query = query.ilike("neighborhood", `%${f.neighborhood}%`);
  if (f.city) query = query.ilike("city", `%${f.city}%`);
  if (f.source) query = query.eq("source", f.source as "landing" | "import" | "manual");
  if (f.status) query = query.eq("status", f.status as "interessado" | "apoiador" | "lideranca" | "indeciso" | "oposicao");
  if (f.supportLevel) query = query.eq("support_level", f.supportLevel as "forte" | "medio" | "fraco" | "indeciso");
  if (f.leadershipId) query = query.eq("leadership_id", f.leadershipId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchDemandsForExport(
  tenantId: string,
  filters: { neighborhood?: string | null; assignedTo?: string | null },
) {
  const supabase = createClient();
  let query = supabase
    .from("demands")
    .select("title, category, status, priority, neighborhood, assigned_to, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (filters.neighborhood) query = query.ilike("neighborhood", `%${filters.neighborhood}%`);
  if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchLeadershipsForExport(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leaderships")
    .select("name, region, estimated_votes, created_at")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchAgendaForExport(tenantId: string, from: string, to: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agenda_events")
    .select("title, event_date, event_time, location, event_type, description")
    .eq("tenant_id", tenantId)
    .gte("event_date", from)
    .lte("event_date", to)
    .order("event_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchActivitiesForExport(tenantId: string, from: string, to: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("message, entity_type, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", `${from}T00:00:00`)
    .lte("created_at", `${to}T23:59:59`)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return data ?? [];
}

export function leadershipsToCsv(
  rows: { name: string; region: string | null; estimated_votes: number | null; created_at: string }[],
): string {
  const header = "nome,regiao,votos_estimados,cadastro\n";
  const body = rows
    .map((r) =>
      [r.name, r.region, r.estimated_votes, r.created_at]
        .map((v) => csvEscape(v == null ? null : String(v)))
        .join(","),
    )
    .join("\n");
  return header + body;
}

export function agendaToCsv(
  rows: {
    title: string;
    event_date: string;
    event_time: string | null;
    location: string | null;
    event_type: string;
  }[],
): string {
  const header = "titulo,data,hora,local,tipo\n";
  const body = rows
    .map((r) =>
      [r.title, r.event_date, r.event_time, r.location, r.event_type]
        .map((v) => csvEscape(v))
        .join(","),
    )
    .join("\n");
  return header + body;
}

export function activitiesToCsv(
  rows: { message: string; entity_type: string | null; created_at: string }[],
): string {
  const header = "mensagem,tipo,data\n";
  const body = rows
    .map((r) => [r.message, r.entity_type, r.created_at].map((v) => csvEscape(v)).join(","))
    .join("\n");
  return header + body;
}

export function territoriesToCsv(
  rows: {
    neighborhood: string;
    supporters: number;
    strong_support_pct: number;
    undecided_pct: number;
    open_demands: number;
    display_score: number;
  }[],
): string {
  const header = "bairro,base,apoio_forte_pct,indecisos_pct,demandas_abertas,score\n";
  const body = rows
    .map((r) =>
      [
        r.neighborhood,
        r.supporters,
        r.strong_support_pct,
        r.undecided_pct,
        r.open_demands,
        r.display_score,
      ]
        .map((v) => csvEscape(v == null ? null : String(v)))
        .join(","),
    )
    .join("\n");
  return header + body;
}

export function demandsToCsv(
  rows: {
    title: string;
    category: string;
    status: string;
    priority: string;
    neighborhood: string | null;
  }[],
): string {
  const header = "titulo,categoria,status,prioridade,bairro\n";
  const body = rows
    .map((d) =>
      [
        d.title,
        DEMAND_CATEGORY_LABELS[d.category] ?? d.category,
        d.status,
        d.priority,
        d.neighborhood,
      ]
        .map((v) => csvEscape(v))
        .join(","),
    )
    .join("\n");
  return header + body;
}

export async function buildExecutiveConsolidatedCsv(
  tenantId: string,
  params: ReportsQueryParams,
): Promise<string> {
  const supporters = await fetchSupportersForExport(tenantId, params);
  const demands = await fetchDemandsForExport(tenantId, {
    neighborhood: params.neighborhood,
    assignedTo: params.assignedTo,
  });
  return buildConsolidatedReportCsv(supporters, demands);
}

export { supportersToCsv };
