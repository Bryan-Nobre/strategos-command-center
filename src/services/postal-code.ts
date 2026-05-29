import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type PostalCodeResolveSuccess = {
  success: true;
  cep: string;
  neighborhood: string | null;
  city: string | null;
  state_uf: string | null;
  ibge_city_code: string | null;
  street?: string | null;
  latitude: number | null;
  longitude: number | null;
  geo_precision: string;
  geo_confidence: string;
  source: string;
  cache_hit?: boolean;
};

export type PostalCodeResolveFailure = {
  success: false;
  reason: "invalid_cep" | "not_found" | "provider_error";
};

export type PostalCodeResolveResult = PostalCodeResolveSuccess | PostalCodeResolveFailure;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function resolvePostalCode(
  cep: string,
  signal?: AbortSignal,
): Promise<PostalCodeResolveResult> {
  const url = `${getSupabaseUrl()}/functions/v1/resolve-postal-code`;
  const apikey = getSupabaseAnonKey();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apikey}`,
        apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cep }),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    return { success: false, reason: "provider_error" };
  }

  if (!res.ok) {
    return { success: false, reason: "provider_error" };
  }

  let payload: PostalCodeResolveResult;
  try {
    payload = (await res.json()) as PostalCodeResolveResult;
  } catch {
    return { success: false, reason: "provider_error" };
  }

  if (!payload || typeof payload !== "object") {
    return { success: false, reason: "provider_error" };
  }

  return payload;
}

import { createClient } from "@/lib/supabase/client";

export async function applySupporterGeoFromCep(
  supporterId: string,
  geo: PostalCodeResolveSuccess,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("apply_supporter_geo_from_cep", {
    p_supporter_id: supporterId,
    p_geo_payload: {
      cep: geo.cep,
      neighborhood: geo.neighborhood,
      city: geo.city,
      state_uf: geo.state_uf,
      ibge_city_code: geo.ibge_city_code,
      latitude: geo.latitude,
      longitude: geo.longitude,
      geo_precision: geo.geo_precision,
      geo_confidence: geo.geo_confidence,
      source: geo.source,
    },
  });
  if (error) throw error;
}
