import { createFileRoute } from "@tanstack/react-router";
import {
  parseDemandasSearch,
  type DemandasListSearch,
} from "@/lib/list-search/demandas";

export const Route = createFileRoute("/_app/demandas")({
  validateSearch: (search: Record<string, unknown>): DemandasListSearch =>
    parseDemandasSearch(search),
});
