import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_BATCH = 100;
const EDGE_BATCH = 50;

type ClaimRow = {
  supporter_id: string;
  tenant_id: string;
  cep: string;
  geo_source: string | null;
  geo_pending: boolean;
  geo_enrichment_attempts: number;
};

type SqlMetrics = {
  processed: number;
  cache_hits: number;
  cache_misses: number;
  failed: number;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function resolvePostalCode(
  supabaseUrl: string,
  serviceRoleKey: string,
  cep: string,
): Promise<{ ok: true; payload: Record<string, unknown> } | { ok: false; reason: string }> {
  const res = await fetch(`${supabaseUrl}/functions/v1/resolve-postal-code`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cep }),
  });

  let body: Record<string, unknown>;
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, reason: "provider_error" };
  }

  if (!res.ok || body.success !== true) {
    const reason = typeof body.reason === "string" ? body.reason : "provider_error";
    return { ok: false, reason };
  }

  return { ok: true, payload: body };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, reason: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ success: false, reason: "misconfigured" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const started = performance.now();

  const { data: sqlMetricsRaw, error: sqlError } = await admin.rpc(
    "process_pending_geo_enrichment",
    { p_limit: DEFAULT_BATCH },
  );

  if (sqlError) {
    console.error("[geo-enrichment-worker] sql phase failed", sqlError.message);
    return jsonResponse({ success: false, reason: "sql_phase_failed" }, 500);
  }

  const sqlMetrics = (sqlMetricsRaw ?? {
    processed: 0,
    cache_hits: 0,
    cache_misses: 0,
    failed: 0,
  }) as SqlMetrics;

  const { data: batchRaw, error: claimError } = await admin.rpc(
    "claim_geo_enrichment_batch",
    { p_limit: EDGE_BATCH },
  );

  if (claimError) {
    console.error("[geo-enrichment-worker] claim failed", claimError.message);
    return jsonResponse({ success: false, reason: "claim_failed", sql: sqlMetrics }, 500);
  }

  const batch = (batchRaw ?? []) as ClaimRow[];
  let edgeResolved = 0;
  let edgeFailed = 0;

  for (const row of batch) {
    const rowStarted = performance.now();
    const latency = () => Math.round(performance.now() - rowStarted);

    try {
      const resolved = await resolvePostalCode(supabaseUrl, serviceRoleKey, row.cep);

      if (!resolved.ok) {
        await admin.rpc("fail_geo_enrichment", {
          p_supporter_id: row.supporter_id,
          p_error: resolved.reason,
          p_provider: null,
          p_cache_hit: false,
          p_latency_ms: latency(),
        });
        edgeFailed += 1;
        continue;
      }

      const { error: applyError } = await admin.rpc("apply_supporter_geo_from_cep", {
        p_supporter_id: row.supporter_id,
        p_geo_payload: resolved.payload,
      });

      if (applyError) {
        await admin.rpc("fail_geo_enrichment", {
          p_supporter_id: row.supporter_id,
          p_error: applyError.message,
          p_provider: String(resolved.payload.source ?? "unknown"),
          p_cache_hit: Boolean(resolved.payload.cache_hit),
          p_latency_ms: latency(),
        });
        edgeFailed += 1;
        continue;
      }

      await admin.rpc("insert_geo_enrichment_log", {
        p_supporter_id: row.supporter_id,
        p_tenant_id: row.tenant_id,
        p_cep: row.cep,
        p_provider: String(resolved.payload.source ?? "unknown"),
        p_cache_hit: Boolean(resolved.payload.cache_hit),
        p_success: true,
        p_error_message: null,
        p_latency_ms: latency(),
      });

      edgeResolved += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown_error";
      await admin.rpc("fail_geo_enrichment", {
        p_supporter_id: row.supporter_id,
        p_error: message,
        p_provider: null,
        p_cache_hit: false,
        p_latency_ms: latency(),
      });
      edgeFailed += 1;
    }
  }

  const totalMs = Math.round(performance.now() - started);
  console.log(
    `[geo-enrichment-worker] done ${totalMs}ms sql=${JSON.stringify(sqlMetrics)} edge=${edgeResolved}/${batch.length} failed=${edgeFailed}`,
  );

  return jsonResponse({
    success: true,
    duration_ms: totalMs,
    sql: sqlMetrics,
    edge: {
      claimed: batch.length,
      resolved: edgeResolved,
      failed: edgeFailed,
    },
  });
});
