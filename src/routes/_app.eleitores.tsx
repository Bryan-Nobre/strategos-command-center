import { createFileRoute } from "@tanstack/react-router";
import {
  parseEleitoresSearch,
  type EleitoresListSearch,
} from "@/lib/list-search/eleitores";

export const Route = createFileRoute("/_app/eleitores")({
  validateSearch: (search: Record<string, unknown>): EleitoresListSearch =>
    parseEleitoresSearch(search),
});
