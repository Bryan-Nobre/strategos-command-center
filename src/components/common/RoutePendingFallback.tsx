import { LoadingState } from "@/components/common/LoadingState";

/** Exibido enquanto um chunk de rota lazy carrega. */
export function RoutePendingFallback() {
  return <LoadingState label="Carregando página…" />;
}
