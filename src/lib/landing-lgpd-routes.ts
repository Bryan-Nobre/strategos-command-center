/** Caminho público legado (redireciona quando possível). */
export const LGPD_REVOKE_LEGACY_PATH = "/revogar-consentimento";

const PRODUCTION_APP_ORIGIN = "https://strategos-command-center.vercel.app";

export function getAppOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  const fromEnv = import.meta.env.VITE_APP_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.replace(/\/+$/, "");
  return PRODUCTION_APP_ORIGIN;
}

function normalizePublicCode(publicCode: string): string {
  return publicCode.trim().toLowerCase();
}

/** Hub público LGPD da campanha (termo + revogação). */
export function landingLgpdHubPath(publicCode: string): string {
  return `/lgpd/${normalizePublicCode(publicCode)}`;
}

export function landingLgpdTermPath(publicCode: string): string {
  return `${landingLgpdHubPath(publicCode)}/termo`;
}

export function landingLgpdRevokePath(publicCode: string): string {
  return `${landingLgpdHubPath(publicCode)}/revogar`;
}

export function landingLgpdRevokeUrl(publicCode: string): string {
  return `${getAppOrigin()}${landingLgpdRevokePath(publicCode)}`;
}

export function defaultRevokeConsentUrl(publicCode?: string): string {
  if (publicCode?.trim()) return landingLgpdRevokeUrl(publicCode);
  return `${getAppOrigin()}${LGPD_REVOKE_LEGACY_PATH}`;
}

export function resolveRevokeConsentUrl(
  configured: string | null | undefined,
  publicCode?: string,
): string {
  const trimmed = configured?.trim();
  if (trimmed) return trimmed;
  return defaultRevokeConsentUrl(publicCode);
}
