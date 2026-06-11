import { Info, TrendingUp, UserPlus, Users, Globe } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { LEADERSHIP_NETWORK_KPI_COPY, LEADERSHIP_POINTS_HELP } from "@/lib/leadership-metrics-copy";

import { formatLeadershipPoints } from "@/lib/leadership-metrics-copy";

import { cn } from "@/lib/utils";



const KPI_ICONS = {

  apoiadores: Users,

  landpage: Globe,

  manual: UserPlus,

  growth: TrendingUp,

} as const;



type SummaryCounts = {

  total_in_network: number;

  with_pledge_count: number;

  crm_only_count: number;

  weekly_growth: number;

};



export function LeadershipNetworkSummary({

  summary,

  totalPoints,

  className,

}: {

  summary: SummaryCounts;

  totalPoints: number;

  className?: string;

}) {

  const values: Record<(typeof LEADERSHIP_NETWORK_KPI_COPY)[number]["id"], number> = {

    apoiadores: summary.total_in_network,

    landpage: summary.with_pledge_count,

    manual: summary.crm_only_count,

    growth: summary.weekly_growth,

  };



  return (

    <div className={cn("space-y-3", className)}>

      <Alert className="border-primary/20 bg-primary/5">

        <Info className="h-4 w-4" aria-hidden />

        <AlertTitle className="text-sm">

          {LEADERSHIP_POINTS_HELP.title}:{" "}

          <span className="tabular-nums">{formatLeadershipPoints(totalPoints)}</span>

        </AlertTitle>

        <AlertDescription className="space-y-1 text-xs leading-relaxed">

          <p>{LEADERSHIP_POINTS_HELP.short}</p>

          <p className="text-muted-foreground">{LEADERSHIP_POINTS_HELP.howItWorks}</p>

        </AlertDescription>

      </Alert>



      <div className="grid gap-2 sm:grid-cols-2">

        {LEADERSHIP_NETWORK_KPI_COPY.map((kpi) => {

          const Icon = KPI_ICONS[kpi.id];

          return (

            <div

              key={kpi.id}

              className="rounded-lg border bg-card px-3 py-2.5 shadow-sm"

            >

              <div className="flex items-start gap-2.5">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">

                  <Icon className="h-4 w-4" aria-hidden />

                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-xl font-semibold tabular-nums leading-none">

                    {values[kpi.id]}

                  </p>

                  <p className="mt-1 text-xs font-medium text-foreground">{kpi.label}</p>

                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">

                    {kpi.description}

                  </p>

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}


