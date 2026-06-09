import { createFileRoute } from "@tanstack/react-router";
import {
  parseAdminTenantsSearch,
  type AdminTenantsListSearch,
} from "@/lib/list-search/admin-tenants";

export const Route = createFileRoute("/_admin/tenants")({
  validateSearch: (search: Record<string, unknown>): AdminTenantsListSearch =>
    parseAdminTenantsSearch(search),
});
