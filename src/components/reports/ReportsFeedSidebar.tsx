import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, AlertTriangle, Download, TrendingUp } from "lucide-react";
import type { ReportsExportLogEntry } from "@/lib/reports-export-log";
import type { ReportsSummary } from "@/services/reports";

type ActivityRow = {
  id: string;
  message: string;
  created_at: string;
  entity_type?: string | null;
};

export function ReportsFeedSidebar({
  activities,
  exportLog,
  pulse,
  activitiesLoading,
}: {
  activities: ActivityRow[];
  exportLog: ReportsExportLogEntry[];
  pulse?: ReportsSummary["pulse"];
  activitiesLoading?: boolean;
}) {
  return (
    <aside className="reports-feed space-y-4">
      <div className="reports-feed-block">
        <h3 className="reports-feed-title">Feed analítico</h3>
        <p className="reports-feed-desc">Movimentos recentes e exportações.</p>
      </div>

      {pulse && pulse.newSupporters > 0 && (
        <div className="reports-feed-highlight flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
          <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong className="text-foreground">+{pulse.newSupporters}</strong> novos apoiadores no
            período selecionado.
          </span>
        </div>
      )}

      {pulse && pulse.criticalTerritories > 0 && (
        <div className="reports-feed-highlight flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <span>
            <strong className="text-foreground">{pulse.criticalTerritories}</strong> território(s)
            em situação crítica.
          </span>
        </div>
      )}

      {exportLog.length > 0 && (
        <div className="reports-feed-block">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Exportações recentes
          </p>
          <ul className="space-y-2">
            {exportLog.slice(0, 5).map((e) => (
              <li key={e.id} className="flex gap-2 text-[11px]">
                <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-medium text-foreground">{e.label}</span>
                  <span className="block text-muted-foreground">
                    {e.rows} linhas ·{" "}
                    {formatDistanceToNow(new Date(e.at), { addSuffix: true, locale: ptBR })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="reports-feed-block reports-feed-panel">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Atividades
        </p>
        {activitiesLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-2 h-10 animate-pulse rounded bg-muted" />
          ))}
        {!activitiesLoading && activities.length === 0 && (
          <p className="py-4 text-center text-[11px] text-muted-foreground">Sem atividades recentes.</p>
        )}
        {!activitiesLoading && activities.length > 0 && (
          <ul className="relative max-h-64 space-y-0 overflow-y-auto">
            <div className="absolute bottom-1 left-[11px] top-1 w-px bg-border/70" aria-hidden />
            {activities.slice(0, 12).map((a) => (
              <li key={a.id} className="relative flex gap-2.5 py-2">
                <div className="relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-primary">
                  <Activity className="h-3 w-3" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[11px] font-medium leading-snug">{a.message}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {format(new Date(a.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
