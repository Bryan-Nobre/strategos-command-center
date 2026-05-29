import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { fetchBrasilApiOnce } from "./providers/brasilapi.ts";
import { fetchViaCepOnce } from "./providers/viacep.ts";
import {
  corsHeaders,
  type ProviderResult,
  type ResolveBody,
  type ResolveSuccess,
} from "./types.ts";
import { jsonResponse, normalizeCep, withProviderRetry } from "./utils/retry.ts";

function toSuccessPayload(row: ProviderResult, cacheHit: boolean): ResolveSuccess {
  return {
    success: true,
    cep: row.cep,
    neighborhood: row.neighborhood,
    city: row.city,
    state_uf: row.state_uf,
    ibge_city_code: row.ibge_city_code,
    street: row.street,
    latitude: row.latitude,
    longitude: row.longitude,
    geo_precision: "cep",
    geo_confidence: row.provider === "brasilapi" ? "high" : "medium",
    source: row.provider,
    cache_hit: cacheHit,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, reason: "provider_error" }, 405);
  }

  const started = performance.now();
  let body: ResolveBody;
  try {
    body = (await req.json()) as ResolveBody;
  } catch {
    return jsonResponse({ success: false, reason: "invalid_cep" }, 400);
  }

  const cep = normalizeCep(body.cep);
  if (!cep) {
    return jsonResponse({ success: false, reason: "invalid_cep" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ success: false, reason: "provider_error" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: cached, error: cacheError } = await admin.rpc(
    "get_postal_code_cache",
    { p_cep: cep },
  );

  if (!cacheError && cached && typeof cached === "object") {
    const c = cached as Record<string, unknown>;
    if (c.success === true) {
      console.log(
        `[resolve-postal-code] cache hit ${cep} ${Math.round(performance.now() - started)}ms`,
      );
      return new Response(JSON.stringify({ ...c, cache_hit: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  console.log(`[resolve-postal-code] cache miss ${cep}`);

  const via = await withProviderRetry("viacep", () => fetchViaCepOnce(cep));
  const resolved = via ?? await withProviderRetry("brasilapi", () => fetchBrasilApiOnce(cep));

  if (!resolved) {
    console.warn(`[resolve-postal-code] not_found ${cep}`);
    return jsonResponse({ success: false, reason: "not_found" });
  }

  const payload = toSuccessPayload(resolved, false);

  const { error: upsertError } = await admin.rpc("upsert_postal_code_cache", {
    p_payload: {
      cep: payload.cep,
      neighborhood: payload.neighborhood,
      city: payload.city,
      state_uf: payload.state_uf,
      ibge_city_code: payload.ibge_city_code,
      street: payload.street,
      latitude: payload.latitude,
      longitude: payload.longitude,
      geo_precision: payload.geo_precision,
      geo_confidence: payload.geo_confidence,
      source: payload.source,
      raw_response: resolved.raw,
    },
  });

  if (upsertError) {
    console.warn("[resolve-postal-code] cache upsert failed", upsertError.message);
  }

  console.log(
    `[resolve-postal-code] resolved ${cep} via ${payload.source} ${Math.round(performance.now() - started)}ms`,
  );

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
