import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, ClipboardList, History, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

type ActivityRow = {
  id: string;
  message: string;
  created_at: string;
  entity_type?: string | null;
};

function iconForEntity(type: string | null | undefined) {
  if (type === "supporter") return UserPlus;
  if (type === "demand") return ClipboardList;
  return Activity;
}

export function DashboardActivityTimeline({
  activities,
  isLoading,
  sectionIndex,
}: {
  activities: ActivityRow[];
  isLoading?: boolean;
  sectionIndex: number;
}) {
  return (
    <DashboardSection
      variant="activity"
      index={sectionIndex}
      title="Atividades recentes"
      description="Últimos movimentos registrados na operação."
      icon={History}
      bodyClassName="dashboard-activity-panel p-3 md:p-4"
    >
      {isLoading &&
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-2.5">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-2 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      {!isLoading && activities.length === 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">Nenhuma atividade registrada.</p>
      )}
      {!isLoading && activities.length > 0 && (
        <ul className="relative space-y-0">
          <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border/80" aria-hidden />
          {activities.map((a, idx) => {
            const Icon = iconForEntity(a.entity_type);
            const at = new Date(a.created_at);
            return (
              <li key={a.id} className={cn("relative flex gap-3 py-2.5 pl-0", idx === 0 && "pt-1")}>
                <div className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-xs font-medium leading-snug text-foreground">{a.message}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(at, { addSuffix: true, locale: ptBR })}
                    <span className="mx-1 opacity-40">·</span>
                    {format(at, "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
}
