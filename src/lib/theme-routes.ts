/** Rotas que sempre usam tema claro (sem modo escuro). */
const LIGHT_ONLY_PATTERNS: RegExp[] = [
  /^\/login\/?$/,
  /^\/signup\/?$/,
  /^\/landpage\/.+/,
];

export function isLightOnlyRoute(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? "/";
  const normalized = path.replace(/\/+$/, "") || "/";
  return LIGHT_ONLY_PATTERNS.some((re) => re.test(normalized));
}
