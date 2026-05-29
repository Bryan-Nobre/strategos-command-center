import type { ProviderResult } from "../types.ts";
import { PROVIDER_TIMEOUT_MS } from "../types.ts";
import { fetchWithTimeout } from "../utils/timeout.ts";
import { titleCase, trimOrNull } from "../utils/retry.ts";

export async function fetchBrasilApiOnce(cep: string): Promise<ProviderResult | null> {
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
  const location = data.location as {
    coordinates?: { latitude?: string; longitude?: string };
  } | undefined;
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
    latitude: location?.coordinates?.latitude
      ? Number(location.coordinates.latitude)
      : null,
    longitude: location?.coordinates?.longitude
      ? Number(location.coordinates.longitude)
      : null,
    raw: data,
  };
}
