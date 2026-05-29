import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CHIPS = [
  { key: "all", label: "Todas" },
  { key: "landing", label: "Cidadão (landing)" },
  { key: "manual", label: "Equipe" },
] as const;

export function DemandasOriginChips({
  origem,
  onChange,
  counts,
}: {
  origem: string;
  onChange: (origem: string) => void;
  counts: { all: number; landing: number; manual: number };
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip) => {
        const count =
          chip.key === "all" ? counts.all : chip.key === "landing" ? counts.landing : counts.manual;
        return (
          <Button
            key={chip.key}
            type="button"
            size="sm"
            variant={origem === chip.key ? "default" : "outline"}
            className={cn("h-7 rounded-full px-3 text-xs")}
            onClick={() => onChange(chip.key)}
          >
            {chip.label}
            <span className="ml-1.5 tabular-nums opacity-80">({count})</span>
          </Button>
        );
      })}
    </div>
  );
}
