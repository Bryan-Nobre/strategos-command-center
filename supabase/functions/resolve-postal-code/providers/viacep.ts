import type { ProviderResult } from "../types.ts";
import { PROVIDER_TIMEOUT_MS } from "../types.ts";
import { fetchWithTimeout } from "../utils/timeout.ts";
import { titleCase, trimOrNull } from "../utils/retry.ts";

export async function fetchViaCepOnce(cep: string): Promise<ProviderResult | null> {
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
  const lat = data.location as {
    coordinates?: { latitude?: string; longitude?: string };
  } | undefined;
  return {
    provider: "viacep",
    cep,
    neighborhood: titleCase(trimOrNull(data.bairro as string)),
    city: titleCase(trimOrNull(data.localidade as string)),
    state_uf: trimOrNull(data.uf as string)?.toUpperCase() ?? null,
    ibge_city_code: trimOrNull(data.ibge as string),
    street: titleCase(trimOrNull(data.logradouro as string)),
    latitude: lat?.coordinates?.latitude ? Number(lat.coordinates.latitude) : null,
    longitude: lat?.coordinates?.longitude
      ? Number(lat.coordinates.longitude)
      : null,
    raw: data,
  };
}
