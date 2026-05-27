import { PERMISSION_FIELD_META } from "@/lib/permission-field-meta";
import { canAccessModule, ROUTE_MODULE_MAP, type PermissionModule, type TenantPermissionsMap } from "@/types/permissions";
import type { LucideIcon } from "lucide-react";
import { Calendar, Crown, MessageSquareWarning, Users } from "lucide-react";

/** Módulos incluídos na busca global v1 (equipe adiada). */
export const SEARCHABLE_MODULES = [
  "supporters",
  "leaderships",
  "demands",
  "agenda",
] as const satisfies readonly PermissionModule[];

export type SearchableModule = (typeof SEARCHABLE_MODULES)[number];

export const SEARCH_MODULE_META: Record<
  SearchableModule,
  { label: string; route: string; icon: LucideIcon; searchHint: string }
> = {
  supporters: {
    label: PERMISSION_FIELD_META.supporters.label,
    route: ROUTE_MODULE_MAP["/eleitores"],
    icon: Users,
    searchHint: "eleitor",
  },
  leaderships: {
    label: PERMISSION_FIELD_META.leaderships.label,
    route: ROUTE_MODULE_MAP["/liderancas"],
    icon: Crown,
    searchHint: "liderança",
  },
  demands: {
    label: PERMISSION_FIELD_META.demands.label,
    route: ROUTE_MODULE_MAP["/demandas"],
    icon: MessageSquareWarning,
    searchHint: "demanda",
  },
  agenda: {
    label: PERMISSION_FIELD_META.agenda.label,
    route: ROUTE_MODULE_MAP["/agenda"],
    icon: Calendar,
    searchHint: "evento",
  },
};

export function buildSearchPlaceholder(permissions: TenantPermissionsMap | null | undefined): string {
  const hints = SEARCHABLE_MODULES.filter((m) => canAccessModule(permissions, m)).map(
    (m) => SEARCH_MODULE_META[m].searchHint,
  );

  if (hints.length === 0) {
    return "Nenhum módulo pesquisável no seu cargo";
  }

  return `Buscar ${hints.join(", ")}…`;
}

export function hasAnySearchableModule(permissions: TenantPermissionsMap | null | undefined): boolean {
  return SEARCHABLE_MODULES.some((m) => canAccessModule(permissions, m));
}
