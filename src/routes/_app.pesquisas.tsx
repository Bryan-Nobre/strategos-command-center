import { createFileRoute } from "@tanstack/react-router";
import {
  parsePesquisasSearch,
  type PesquisasListSearch,
} from "@/lib/list-search/pesquisas";

export const Route = createFileRoute("/_app/pesquisas")({
  validateSearch: (search: Record<string, unknown>): PesquisasListSearch =>
    parsePesquisasSearch(search),
});
