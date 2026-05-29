import { Badge } from "@/components/ui/badge";
import {
  ENGAGEMENT_STATUS_LABELS,
  type SupporterEngagementStatus,
  isEngagementStatus,
} from "@/lib/supporter-engagement";
import { cn } from "@/lib/utils";

const VARIANTS: Record<
  SupporterEngagementStatus,
  string
> = {
  hot: "border-red-500/40 bg-red-500/15 text-red-800 dark:text-red-200",
  warm: "border-orange-500/40 bg-orange-500/15 text-orange-900 dark:text-orange-200",
  cold: "border-sky-500/40 bg-sky-500/15 text-sky-900 dark:text-sky-200",
  inactive: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
};

/** Temperatura política — cálculo real no backend (recompute_supporter_activity_state). */
export function SupporterEngagementBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  if (!status || !isEngagementStatus(status)) return null;
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", VARIANTS[status], className)}
    >
      {ENGAGEMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
