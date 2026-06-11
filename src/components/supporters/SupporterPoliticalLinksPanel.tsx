import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Crown, Link2, Vote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/common/LoadingState";
import { useSupporterPoliticalDetail } from "@/hooks/use-supporter-political";
import {
  SUPPORTER_LEADERSHIP_LINK_SOURCE_LABELS,
  SUPPORTER_LEADERSHIP_RELATIONSHIP_LABELS,
} from "@/types/domain";
import { cn } from "@/lib/utils";

export function SupporterPoliticalLinksPanel({
  tenantId,
  supporterId,
  className,
}: {
  tenantId: string;
  supporterId: string;
  className?: string;
}) {
  const { data, isLoading, isError } = useSupporterPoliticalDetail(tenantId, supporterId);

  if (isLoading) {
    return (
      <div className={cn("py-4", className)}>
        <LoadingState label="Carregando vínculos políticos..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Não foi possível carregar os vínculos políticos.
      </p>
    );
  }

  const { links, pledges } = data;

  return (
    <div className={cn("space-y-4 rounded-lg border bg-muted/20 p-4", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Link2 className="size-4 text-primary" aria-hidden />
        Vínculos políticos
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum vínculo com liderança registrado.</p>
      ) : (
        <ul className="space-y-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {link.is_primary && (
                  <Badge variant="default" className="gap-1 shrink-0">
                    <Crown className="size-3" aria-hidden />
                    Primária
                  </Badge>
                )}
                <span className="font-medium truncate">{link.leadership_name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">
                  {SUPPORTER_LEADERSHIP_RELATIONSHIP_LABELS[link.relationship_type] ??
                    link.relationship_type}
                </Badge>
                <span>1 ponto</span>
                <span>
                  {SUPPORTER_LEADERSHIP_LINK_SOURCE_LABELS[link.source] ?? link.source}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pledges.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Vote className="size-4 text-primary" aria-hidden />
            Chapas apoiadas
          </div>
          <ul className="space-y-1.5">
            {pledges.map((p) => (
              <li
                key={p.chapa_id}
                className="flex flex-wrap justify-between gap-1 text-sm text-muted-foreground"
              >
                <span>
                  <span className="text-foreground">{p.chapa_name}</span>
                  <span className="mx-1">·</span>
                  {p.leadership_name}
                </span>
                <span className="text-xs">
                  {p.pledged_at
                    ? ` · ${format(new Date(p.pledged_at), "dd/MM/yy", { locale: ptBR })}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function formatLeadershipSummaryLabel(
  primaryName: string | null | undefined,
  linkCount: number,
  allNames: string[],
): string {
  if (linkCount === 0) return "—";
  if (linkCount === 1) return primaryName ?? allNames[0] ?? "—";
  const base = primaryName ?? allNames[0] ?? "Liderança";
  return `${base} +${linkCount - 1}`;
}
