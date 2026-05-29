/** Match de filtro territorial no client (espelha supporter_matches_neighborhood_filter). */
export function territoryFilterMatches(
  filter: string | undefined | null,
  neighborhood: string | null | undefined,
  normalizedNeighborhood: string | null | undefined,
): boolean {
  const f = filter?.trim();
  if (!f || f === "all") return true;
  const key = (normalizedNeighborhood ?? neighborhood ?? "").trim().toLowerCase();
  const label = (neighborhood ?? "").trim().toLowerCase();
  const q = f.toLowerCase();
  if (key === q || label === q) return true;
  if (label.includes(q) || key.includes(q)) return true;
  return false;
}
