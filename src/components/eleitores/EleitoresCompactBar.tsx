import { Globe, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function EleitoresCompactBar({
  total,
  filtered,
  new7d,
  landingCount,
  className,
}: {
  total: number;
  filtered: number;
  new7d: number;
  landingCount: number;
  className?: string;
}) {
  return (
    <div className={cn("eleitores-compact-bar", className)}>
      <div className="eleitores-compact-stat">
        <Users className="h-4 w-4 text-primary" aria-hidden />
        <span>
          <strong className="tabular-nums">{filtered}</strong>
          {filtered !== total && (
            <span className="text-muted-foreground"> de {total}</span>
          )}{" "}
          na lista
        </span>
      </div>
      <div className="eleitores-compact-stat">
        <span className="text-muted-foreground">Novos (7d):</span>
        <strong className="tabular-nums text-foreground">+{new7d}</strong>
      </div>
      <div className="eleitores-compact-stat">
        <Globe className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
        <span>
          <strong className="tabular-nums">{landingCount}</strong> via landing
        </span>
      </div>
    </div>
  );
}
