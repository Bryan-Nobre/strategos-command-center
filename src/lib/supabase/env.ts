/**
 * URL base do projeto Supabase (sem /rest/v1).
 * O client JS adiciona /rest/v1 e /auth/v1 automaticamente.
 */
export function getSupabaseUrl(): string {
  const raw = import.meta.env.VITE_SUPABASE_URL;
  if (!raw?.trim()) {
    throw new Error("VITE_SUPABASE_URL não configurada");
  }

  let url = raw.trim().replace(/\/+$/, "");
  // Erro comum: colar a URL da API REST em vez da Project URL
  url = url.replace(/\/rest\/v1$/i, "");

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("protocolo inválido");
    }
    return parsed.origin;
  } catch {
    throw new Error(
      "VITE_SUPABASE_URL inválida. Use apenas a Project URL, ex.: https://xxxx.supabase.co (sem /rest/v1)",
    );
  }
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key?.trim()) throw new Error("VITE_SUPABASE_ANON_KEY não configurada");
  return key.trim();
}
