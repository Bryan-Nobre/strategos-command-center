import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AGENDA_EVENT_TYPE_LABELS } from "@/types/domain";

const ORIGIN_CHIPS = [
  { key: "all", label: "Todos" },
  { key: "com_apoiadores", label: "Com apoiadores" },
  { key: "sem_apoiadores", label: "Sem apoiadores" },
] as const;

export function AgendaFilterChips({
  tipo,
  filtro,
  onTipoChange,
  onFiltroChange,
}: {
  tipo: string;
  filtro: string;
  onTipoChange: (tipo: string) => void;
  onFiltroChange: (filtro: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={tipo === "all" ? "default" : "outline"}
          className="h-7 rounded-full px-3 text-xs"
          onClick={() => onTipoChange("all")}
        >
          Todos os tipos
        </Button>
        {Object.entries(AGENDA_EVENT_TYPE_LABELS).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={tipo === key ? "default" : "outline"}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => onTipoChange(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {ORIGIN_CHIPS.map((chip) => (
          <Button
            key={chip.key}
            type="button"
            size="sm"
            variant={filtro === chip.key ? "default" : "outline"}
            className={cn("h-7 rounded-full px-3 text-xs")}
            onClick={() => onFiltroChange(chip.key)}
          >
            {chip.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
