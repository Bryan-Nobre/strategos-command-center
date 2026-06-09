import { createFileRoute } from "@tanstack/react-router";
import {
  parseRelatoriosSearch,
  type RelatoriosListSearch,
} from "@/lib/list-search/relatorios";

export const Route = createFileRoute("/_app/relatorios")({
  validateSearch: (search: Record<string, unknown>): RelatoriosListSearch =>
    parseRelatoriosSearch(search),
});
