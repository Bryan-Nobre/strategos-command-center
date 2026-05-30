import type { EnrichedTerritory } from "@/services/dashboard-intelligence";
import { territoryFilterMatches } from "@/lib/territory-match";

export type TerritoryFilter = {
  neighborhood: string;
  city?: string | null;
  stateUf?: string | null;
};

export function neighborhoodLabelMatches(
  filter: string | undefined | null,
  label: string | undefined | null,
): boolean {
  if (!filter?.trim()) return true;
  const target = label?.trim() ?? "";
  if (!target) return false;
  return territoryFilterMatches(filter, target, target);
}

export function filterTerritoriesByNeighborhood<T extends { neighborhood: string }>(
  items: T[],
  neighborhood: string | undefined | null,
): T[] {
  if (!neighborhood?.trim()) return items;
  return items.filter((item) => neighborhoodLabelMatches(neighborhood, item.neighborhood));
}

export function filterEnrichedTerritories(
  items: EnrichedTerritory[],
  neighborhood: string | undefined | null,
): EnrichedTerritory[] {
  if (!neighborhood?.trim()) return items;
  return items.filter(
    (item) =>
      neighborhoodLabelMatches(neighborhood, item.neighborhood) ||
      neighborhoodLabelMatches(neighborhood, item.territoryLabel),
  );
}

export function filterApprovalByNeighborhood(
  rows: { bairro: string; aprovacao: number }[],
  neighborhood: string | undefined | null,
): { bairro: string; aprovacao: number }[] {
  if (!neighborhood?.trim()) return rows;
  return rows.filter((row) => neighborhoodLabelMatches(neighborhood, row.bairro));
}

export function territoryFilterLabel(filter: TerritoryFilter | null | undefined): string | null {
  if (!filter?.neighborhood?.trim()) return null;
  return [filter.neighborhood, filter.city, filter.stateUf].filter(Boolean).join(" · ");
}
