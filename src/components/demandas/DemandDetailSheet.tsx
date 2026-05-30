import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Pencil, User } from "lucide-react";
import { PhoneDisplay } from "@/components/common/PhoneDisplay";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemandSourceBadge } from "@/components/demandas/DemandSourceBadge";
import type { DemandRow } from "@/components/demandas/DemandasKanban";
import {
  DEMAND_CATEGORY_LABELS,
  DEMAND_PRIORITY_LABELS,
  DEMAND_STATUS_LABELS,
} from "@/types/domain";

const prioVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  alta: "destructive",
  media: "secondary",
  baixa: "outline",
};

export function DemandDetailSheet({
  demand,
  teamMap,
  open,
  onOpenChange,
  canUpdate,
  onEdit,
}: {
  demand: DemandRow | null;
  teamMap: Map<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdate: boolean;
  onEdit: () => void;
}) {
  if (!demand) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="pr-8 text-left leading-snug">{demand.title}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <DemandSourceBadge source={demand.source} />
            <Badge variant="outline">{DEMAND_STATUS_LABELS[demand.status] ?? demand.status}</Badge>
            <Badge variant={prioVariant[demand.priority]}>
              {DEMAND_PRIORITY_LABELS[demand.priority] ?? demand.priority}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Categoria</p>
            <p>{DEMAND_CATEGORY_LABELS[demand.category] ?? demand.category}</p>
          </div>

          {demand.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Descrição</p>
              <p className="whitespace-pre-wrap leading-relaxed">{demand.description}</p>
            </div>
          )}

          {(demand.neighborhood || demand.requester_city) && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {[demand.neighborhood, demand.requester_city].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}

          {demand.source === "landing" && (demand.requester_name || demand.requester_phone) && (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-2">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
                Solicitante (landing)
              </p>
              {demand.requester_name && (
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {demand.requester_name}
                </p>
              )}
              {demand.requester_phone && (
                <p className="flex items-center gap-2">
                  <PhoneDisplay phone={demand.requester_phone} showIcon />
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground">Responsável</p>
            <p>
              {demand.assigned_to
                ? (teamMap.get(demand.assigned_to) ?? "Membro da equipe")
                : "Sem responsável"}
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>
              Criada em{" "}
              {format(new Date(demand.created_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
            </p>
            {demand.updated_at !== demand.created_at && (
              <p>
                Atualizada em{" "}
                {format(new Date(demand.updated_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>

          {canUpdate && (
            <Button variant="outline" className="w-full" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar demanda
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
