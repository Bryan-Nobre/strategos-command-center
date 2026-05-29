import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROVIDER_TIMEOUT_MS = 3000;
const MAX_ATTEMPTS_PER_PROVIDER = 2;
const RETRY_JITTER_MIN_MS = 200;
const RETRY_JITTER_MAX_MS = 400;

type ResolveBody = { cep?: string };

type ResolveSuccess = {
  success: true;
  cep: string;
  neighborhood: string | null;
  city: string | null;
  state_uf: string | null;
  ibge_city_code: string | null;
  street: string | null;
  latitude: number | null;
  longitude: number | null;
  geo_precision: string;
  geo_confidence: string;
  source: string;
  cache_hit?: boolean;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCep(input: string | undefined | null): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function titleCase(value: string | null): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function retryJitterMs(): number {
  return RETRY_JITTER_MIN_MS +
    Math.floor(Math.random() * (RETRY_JITTER_MAX_MS - RETRY_JITTER_MIN_MS + 1));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

type ProviderResult = {
  provider: string;
  cep: string;
  neighborhood: string | null;
  city: string | null;
  state_uf: string | null;
  ibge_city_code: string | null;
  street: string | null;
  latitude: number | null;
  longitude: number | null;
  raw: Record<string, unknown>;
};

async function fetchViaCepOnce(cep: string): Promise<ProviderResult | null> {
  const started = performance.now();
  const res = await fetchWithTimeout(
    `https://viacep.com.br/ws/${cep}/json/`,
    PROVIDER_TIMEOUT_MS,
  );
  if (!res.ok) {
    console.warn("[resolve-postal-code] viacep http", res.status);
    return null;
  }
  const data = (await res.json()) as Record<string, unknown>;
  if (data.erro === true || data.erro === "true") {
    console.warn("[resolve-postal-code] viacep not_found", cep);
    return null;
  }
  console.log(
    `[resolve-postal-code] viacep ok ${Math.round(performance.now() - started)}ms`,
  );
  const lat = data.location as { coordinates?: { latitude?: string; longitude?: string } } | undefined;
  return {
    provider: "viacep",
    cep,
    neighborhood: titleCase(trimOrNull(data.bairro as string)),
    city: titleCase(trimOrNull(data.localidade as string)),
    state_uf: trimOrNull(data.uf as string)?.toUpperCase() ?? null,
    ibge_city_code: trimOrNull(data.ibge as string),
    street: titleCase(trimOrNull(data.logradouro as string)),
    latitude: lat?.coordinates?.latitude ? Number(lat.coordinates.latitude) : null,
    longitude: lat?.coordinates?.longitude ? Number(lat.coordinates.longitude) : null,
    raw: data,
  };
}

async function fetchBrasilApiOnce(cep: string): Promise<ProviderResult | null> {
  const started = performance.now();
  const res = await fetchWithTimeout(
    `https://brasilapi.com.br/api/cep/v2/${cep}`,
    PROVIDER_TIMEOUT_MS,
  );
  if (!res.ok) {
    console.warn("[resolve-postal-code] brasilapi http", res.status);
    return null;
  }
  const data = (await res.json()) as Record<string, unknown>;
  const location = data.location as { coordinates?: { latitude?: string; longitude?: string } } | undefined;
  console.log(
    `[resolve-postal-code] brasilapi ok ${Math.round(performance.now() - started)}ms`,
  );
  return {
    provider: "brasilapi",
    cep,
    neighborhood: titleCase(trimOrNull(data.neighborhood as string)),
    city: titleCase(trimOrNull(data.city as string)),
    state_uf: trimOrNull(data.state as string)?.toUpperCase() ?? null,
    ibge_city_code: trimOrNull(String(data.city_ibge ?? "")),
    street: titleCase(trimOrNull(data.street as string)),
    latitude: location?.coordinates?.latitude ? Number(location.coordinates.latitude) : null,
    longitude: location?.coordinates?.longitude ? Number(location.coordinates.longitude) : null,
    raw: data,
  };
}

async function withProviderRetry(
  provider: string,
  attemptFn: () => Promise<ProviderResult | null>,
): Promise<ProviderResult | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_PROVIDER; attempt++) {
    try {
      const result = await attemptFn();
      if (result) return result;
    } catch (e) {
      console.warn(`[resolve-postal-code] ${provider} error attempt=${attempt}`, e);
    }

    if (attempt < MAX_ATTEMPTS_PER_PROVIDER) {
      const jitter = retryJitterMs();
      console.log(
        `[resolve-postal-code] ${provider} retry_attempt=${attempt} sleep_ms=${jitter}`,
      );
      await sleep(jitter);
    }
  }
  return null;
}

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
      return jsonResponse({ ...c, cache_hit: true });
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

  return jsonResponse(payload);
});
