import { createClient } from "@/lib/supabase/client";
import { mapReportsSummaryPayload, type ReportsSummary } from "@/lib/reports-mapper";
import { buildReportsRpcPayload } from "@/lib/reports-rpc-params";

export type ReportsQueryParams = {
  tenantId: string;
  from: string;
  to: string;
  neighborhood?: string | null;
  city?: string | null;
  source?: string | null;
  status?: string | null;
  supportLevel?: string | null;
  leadershipId?: string | null;
  assignedTo?: string | null;
};

/** Agregação no servidor (RLS + RPC). */
export async function getReportsSummary(params: ReportsQueryParams): Promise<ReportsSummary> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "get_tenant_reports_summary",
    buildReportsRpcPayload(params),
  );
  if (error) throw error;
  return mapReportsSummaryPayload(data);
}

export type { ReportsSummary };
