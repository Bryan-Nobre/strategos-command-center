import { createFileRoute } from "@tanstack/react-router";
import { parseConfiguracoesSearch } from "@/lib/list-search/configuracoes";

export const Route = createFileRoute("/_app/configuracoes")({
  validateSearch: parseConfiguracoesSearch,
});
