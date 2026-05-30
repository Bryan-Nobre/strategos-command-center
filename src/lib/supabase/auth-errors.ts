/** Sessão local inválida ou revogada no Supabase (refresh expirado / usuário removido). */
export function isStaleAuthSessionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string; status?: number };
  if (e.code === "refresh_token_not_found") return true;
  if (e.status === 400 && e.message?.includes("Refresh Token")) return true;
  return false;
}
