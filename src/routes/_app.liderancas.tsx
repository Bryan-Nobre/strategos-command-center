import { createFileRoute } from "@tanstack/react-router";
import { parseLiderancasSearch } from "@/lib/list-search/liderancas";

export const Route = createFileRoute("/_app/liderancas")({
  validateSearch: (search: Record<string, unknown>) => parseLiderancasSearch(search),
});
