export type ResolveBody = { cep?: string };

export type ProviderResult = {
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

export type ResolveSuccess = {
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

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const PROVIDER_TIMEOUT_MS = 3000;
export const MAX_ATTEMPTS_PER_PROVIDER = 2;
export const RETRY_JITTER_MIN_MS = 200;
export const RETRY_JITTER_MAX_MS = 400;
