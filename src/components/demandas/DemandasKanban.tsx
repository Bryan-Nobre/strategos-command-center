import { useRef, useState, type DragEvent as ReactDragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  GripVertical,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMAND_CATEGORY_LABELS, DEMAND_PRIORITY_LABELS } from "@/types/domain";
import type { Enums } from "@/types/supabase";
import { DEEP_LINK_HIGHLIGHT_CLASS } from "@/lib/search-deep-link";
import { DemandSourceBadge } from "@/components/demandas/DemandSourceBadge";
import type { listDemands } from "@/services/demands";

export type DemandRow = Awaited<ReturnType<typeof listDemands>>[number];

const columns = [
  {
    key: "aberto" as const,
    dbStatus: "aberto" as Enums<"demand_status">,
    title: "Aberto",
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    ring: "ring-destructive/30",
  },
  {
    key: "andamento" as const,
    dbStatus: "em_andamento" as Enums<"demand_status">,
    title: "Em andamento",
    icon: Clock,
    color: "text-warning-foreground",
    bg: "bg-warning/15",
    ring: "ring-warning/40",
  },
  {
    key: "resolvido" as const,
    dbStatus: "resolvido" as Enums<"demand_status">,
    title: "Resolvido",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    ring: "ring-success/30",
  },
];

const prioVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  alta: "destructive",
  media: "secondary",
  baixa: "outline",
};

export function DemandasKanban({
  grouped,
  teamMap,
  highlightId,
  canUpdate,
  canDelete,
  isUpdating,
  onMove,
  onEdit,
  onDelete,
  onOpenDetail,
}: {
  grouped: Record<"aberto" | "andamento" | "resolvido", DemandRow[]>;
  teamMap: Map<string, string>;
  highlightId?: string;
  canUpdate: boolean;
  canDelete: boolean;
  isUpdating: boolean;
  onMove: (id: string, status: Enums<"demand_status">) => void;
  onEdit: (d: DemandRow) => void;
  onDelete: (d: DemandRow) => void;
  onOpenDetail: (d: DemandRow) => void;
}) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Enums<"demand_status"> | null>(null);
  const [draggedDemandId, setDraggedDemandId] = useState<string | null>(null);

  function handleDragStart(e: ReactDragEvent, id: string) {
    setDraggedDemandId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDragOverStatus(null);
    setDraggedDemandId(null);
  }

  function handleDrop(e: ReactDragEvent, status: Enums<"demand_status">) {
    if (!canUpdate) return;
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedDemandId;
    if (id) onMove(id, status);
    setDragOverStatus(null);
    setDraggedDemandId(null);
  }

  return (
    <div className="demandas-kanban-scroll">
      <div className="demandas-kanban-grid">
        {columns.map((col) => {
          const items = grouped[col.key];
          return (
            <div
              key={col.key}
              className={[
                "demandas-kanban-column",
                dragOverStatus === col.dbStatus ? `ring-2 ${col.ring}` : "",
              ].join(" ")}
              onDragOver={(e) => {
                e.preventDefault();
                if (isUpdating || !canUpdate) return;
                setDragOverStatus(col.dbStatus);
                e.dataTransfer.dropEffect = "move";
              }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(e) => handleDrop(e, col.dbStatus)}
            >
              <div className="demandas-kanban-column-header">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${col.bg} ${col.color}`}
                  >
                    <col.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{col.title}</h3>
                    <p className="text-[10px] text-muted-foreground">
                      {canUpdate ? "Arraste cards ou use as setas" : "Somente leitura"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="tabular-nums">
                  {items.length}
                </Badge>
              </div>
              <div className="demandas-kanban-cards">
                {items.map((d) => (
                  <Card
                    key={d.id}
                    ref={d.id === highlightId ? highlightRef : undefined}
                    className={[
                      "demandas-kanban-card group",
                      draggedDemandId === d.id ? "opacity-60 scale-[0.98]" : "",
                      d.id === highlightId ? DEEP_LINK_HIGHLIGHT_CLASS : "",
                    ].join(" ")}
                  >
                    <CardContent className="p-0">
                      <div className="flex gap-1 p-3 pb-2">
                        {canUpdate && (
                          <button
                            type="button"
                            className="demandas-drag-handle mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                            draggable={!isUpdating}
                            onDragStart={(e) => handleDragStart(e, d.id)}
                            onDragEnd={handleDragEnd}
                            aria-label="Arrastar demanda"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => onOpenDetail(d)}
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <DemandSourceBadge source={d.source} />
                            <Badge variant={prioVariant[d.priority]} className="text-[10px]">
                              {DEMAND_PRIORITY_LABELS[d.priority] ?? d.priority}
                            </Badge>
                          </div>
                          <h4 className="mt-1.5 text-sm font-medium leading-snug">{d.title}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span>{DEMAND_CATEGORY_LABELS[d.category] ?? d.category}</span>
                            {d.neighborhood && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {d.neighborhood}
                              </span>
                            )}
                          </div>
                          {d.source === "landing" && d.requester_name && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              Por: {d.requester_name}
                              {d.requester_phone ? ` · ${d.requester_phone}` : ""}
                            </p>
                          )}
                          {d.assigned_to && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              Responsável: {teamMap.get(d.assigned_to) ?? "—"}
                            </p>
                          )}
                        </button>
                        <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onEdit(d)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => onDelete(d)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {canUpdate && (
                        <div className="flex flex-wrap gap-1 border-t border-border/50 px-3 py-2">
                          {columns
                            .filter((c) => c.dbStatus !== d.status)
                            .map((c) => (
                              <Button
                                key={c.key}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                disabled={isUpdating}
                                onClick={() => onMove(d.id, c.dbStatus)}
                              >
                                → {c.title}
                              </Button>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {!items.length && (
                  <p className="demandas-kanban-empty">Solte aqui ou crie uma demanda</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
