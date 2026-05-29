import { UserCheck, UserX, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeamCompactBar({
  active,
  suspended,
  slotsLabel,
  className,
}: {
  active: number;
  suspended: number;
  slotsLabel: string | null;
  className?: string;
}) {
  return (
    <div className={cn("team-compact-bar", className)}>
      <div className="team-compact-stat">
        <Users className="h-4 w-4 text-primary" aria-hidden />
        <span>
          <strong className="tabular-nums">{active}</strong> ativos
        </span>
      </div>
      {suspended > 0 && (
        <div className="team-compact-stat">
          <UserX className="h-4 w-4 text-amber-600" aria-hidden />
          <span>
            <strong className="tabular-nums">{suspended}</strong> bloqueados
          </span>
        </div>
      )}
      {slotsLabel && (
        <div className="team-compact-stat">
          <UserCheck className="h-4 w-4 text-violet-600" aria-hidden />
          <span>{slotsLabel}</span>
        </div>
      )}
    </div>
  );
}
