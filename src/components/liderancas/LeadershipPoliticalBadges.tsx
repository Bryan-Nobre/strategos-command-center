import { Badge } from "@/components/ui/badge";
import { SupporterSourceBadge } from "@/components/supporters/SupporterSourceBadge";
import {
  SUPPORTER_LEADERSHIP_LINK_SOURCE_LABELS,
  SUPPORTER_LEADERSHIP_RELATIONSHIP_LABELS,
} from "@/types/domain";
import { linkSourceForBadge } from "@/lib/leadership-network";
import { cn } from "@/lib/utils";

export function LeadershipPrimaryBadge({ isPrimary }: { isPrimary: boolean }) {
  if (isPrimary) {
    return (
      <Badge variant="default" className="text-[10px]">
        Primária
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px]">
      Secundária
    </Badge>
  );
}

export function LeadershipRelationshipBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary" className="text-[10px] font-normal">
      {SUPPORTER_LEADERSHIP_RELATIONSHIP_LABELS[type] ?? type}
    </Badge>
  );
}

export function LeadershipLinkSourceBadge({ source }: { source: string }) {
  const badgeSource = linkSourceForBadge(source);
  if (badgeSource === "landing" || badgeSource === "manual" || badgeSource === "import") {
    return <SupporterSourceBadge source={badgeSource} />;
  }
  return (
    <Badge variant="outline" className="text-[10px]">
      {SUPPORTER_LEADERSHIP_LINK_SOURCE_LABELS[source] ?? source}
    </Badge>
  );
}

export function LeadershipWeightBadge({ weight, className }: { weight: number; className?: string }) {
  const label = weight === 1 ? "1 ponto" : `${weight} pontos`;
  return (
    <Badge
      variant="outline"
      title="Pontos que esta pessoa soma nesta liderança (chapas na landpage ou vínculo manual)"
      className={cn("tabular-nums font-semibold text-[10px]", className)}
    >
      {label}
    </Badge>
  );
}
