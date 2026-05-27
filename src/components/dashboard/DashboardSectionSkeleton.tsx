import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardMetricsSkeleton() {
  return (
    <div className="dashboard-metrics-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-start gap-4 p-5">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardBlockSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3 pb-6">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-3 w-64" />
      </CardHeader>
      <CardContent className="pb-6">
        <Skeleton className="h-72 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}
