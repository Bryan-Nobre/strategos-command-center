import { Skeleton } from "@/components/ui/skeleton";

export function ReportsPageSkeleton() {
  return (
    <div className="reports-analytics space-y-6">
      <Skeleton className="h-52 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
