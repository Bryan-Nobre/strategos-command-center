import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIEWS = [
  { key: "dia", label: "Dia" },
  { key: "semana", label: "Semana" },
  { key: "lista", label: "Próximos 30d" },
] as const;

export function AgendaViewToggle({
  view,
  onChange,
}: {
  view: string;
  onChange: (view: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border/80 bg-muted/30 p-0.5">
      {VIEWS.map((v) => (
        <Button
          key={v.key}
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 rounded-md px-3 text-xs",
            view === v.key && "bg-background shadow-sm",
          )}
          onClick={() => onChange(v.key)}
        >
          {v.label}
        </Button>
      ))}
    </div>
  );
}
