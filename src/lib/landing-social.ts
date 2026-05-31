const INSTAGRAM_HOSTS = ["instagram.com", "www.instagram.com"];

export function getInstagramFromSocialLinks(social: unknown): string {
  if (!social || typeof social !== "object" || Array.isArray(social)) return "";
  const row = social as Record<string, unknown>;
  return typeof row.instagram === "string" ? row.instagram.trim() : "";
}

/** Aceita URL completa, @usuario ou usuário simples. */
export function normalizeInstagramUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (!INSTAGRAM_HOSTS.includes(url.hostname.toLowerCase())) return null;
      return url.toString();
    } catch {
      return null;
    }
  }

  const handle = value.replace(/^@/, "").replace(/\//g, "").trim();
  if (!handle || !/^[a-zA-Z0-9._]+$/.test(handle)) return null;
  return `https://www.instagram.com/${handle}/`;
}

export function serializeLandingSocialLinks(
  existing: unknown,
  instagram: string,
): Record<string, string> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, string>) }
      : {};
  const normalized = normalizeInstagramUrl(instagram);
  if (normalized) {
    base.instagram = normalized;
  } else {
    delete base.instagram;
  }
  return base;
}
