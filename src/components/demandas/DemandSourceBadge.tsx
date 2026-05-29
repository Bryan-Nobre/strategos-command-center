import { Globe, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEMAND_SOURCE_LABELS } from "@/types/domain";
import { cn } from "@/lib/utils";

export function DemandSourceBadge({
  source,
  className,
}: {
  source: string | null | undefined;
  className?: string;
}) {
  const isLanding = source === "landing";
  return (
    <Badge
      variant={isLanding ? "secondary" : "outline"}
      className={cn(
        "gap-1 text-[10px] font-normal",
        isLanding && "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        className,
      )}
    >
      {isLanding ? (
        <Globe className="h-3 w-3" aria-hidden />
      ) : (
        <Users className="h-3 w-3" aria-hidden />
      )}
      {DEMAND_SOURCE_LABELS[source ?? "manual"] ?? "Equipe"}
    </Badge>
  );
}
