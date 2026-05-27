/** Utilitários para filtros serializados na URL (somente UX — RLS no backend). */

export function trimParam(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

export function pickEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  if (typeof value !== "string") return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/** Valor de select: `all` na UI não vai para a URL. */
export function fromUrlSelect(value: unknown, allowed?: readonly string[]): string {
  const s = trimParam(value);
  if (!s || s === "all") return "all";
  if (allowed && !allowed.includes(s)) return "all";
  return s;
}

export function toUrlSelect(value: string): string | undefined {
  if (!value || value === "all") return undefined;
  return value;
}

export function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

export function countActiveFilters(
  entries: Array<boolean | undefined | null>,
): number {
  return entries.filter(Boolean).length;
}
