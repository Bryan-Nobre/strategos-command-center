import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, UserPlus, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function ActivityFeed({
  activities,
  isLoading,
}: {
  activities: ActivityRow[];
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Atividades recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pb-6">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-2 py-2.5">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        {!isLoading &&
          activities.map((a) => {
          const Icon = iconForEntity(a.entity_type);
          const at = new Date(a.created_at);
          return (
            <div
              key={a.id}
              className="flex gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-theme hover:border-border/60 hover:bg-muted/30"
            >
              <div className="metric-icon-wrap h-9 w-9 shrink-0 [&_svg]:h-4 [&_svg]:w-4">
                <Icon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-foreground">{a.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDistanceToNow(at, { addSuffix: true, locale: ptBR })}
                  <span className="mx-1 opacity-40">·</span>
                  {format(at, "dd/MM HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          );
        })}
        {!isLoading && !activities.length && (
          <p className="py-4 text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
        )}
      </CardContent>
    </Card>
  );
}
