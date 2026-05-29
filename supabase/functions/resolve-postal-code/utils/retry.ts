import {
  corsHeaders,
  MAX_ATTEMPTS_PER_PROVIDER,
  RETRY_JITTER_MAX_MS,
  RETRY_JITTER_MIN_MS,
} from "../types.ts";

export function retryJitterMs(): number {
  return RETRY_JITTER_MIN_MS +
    Math.floor(Math.random() * (RETRY_JITTER_MAX_MS - RETRY_JITTER_MIN_MS + 1));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withProviderRetry(
  provider: string,
  attemptFn: () => Promise<import("../types.ts").ProviderResult | null>,
): Promise<import("../types.ts").ProviderResult | null> {
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

export function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

export function titleCase(value: string | null): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function normalizeCep(input: string | undefined | null): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

export function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
