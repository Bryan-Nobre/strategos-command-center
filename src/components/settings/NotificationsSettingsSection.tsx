import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { queryKeys } from "@/lib/query-keys";
import { NOTIFICATION_PREF_GROUPS } from "@/lib/notification-pref-meta";
import { getUserPreferences, upsertUserPreferences } from "@/services/team";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  notificationPreferencesToJson,
  parseNotificationPreferences,
  type NotificationPrefCategory,
  type NotificationPreferences,
} from "@/types/notification-preferences";
import { useQuery } from "@tanstack/react-query";

const WORKING_TYPES = [
  "Demandas: atribuição, status, alta prioridade, digest sem responsável",
  "Eleitores: novo cadastro na landing e importação CSV concluída",
  "Equipe: convite aceito e novo membro",
];

const PENDING_TYPES = [
  "Agenda: eventos de hoje e amanhã (requer job diário no servidor — função notify_agenda_daily_reminders)",
];

export function NotificationsSettingsSection({
  tenantId,
  canEdit,
}: {
  tenantId: string;
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const { data: prefs } = useQuery({
    queryKey: queryKeys.prefs(tenantId),
    queryFn: () => getUserPreferences(tenantId),
    enabled: !!tenantId,
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );

  useEffect(() => {
    if (prefs?.notifications) {
      setNotificationPrefs(parseNotificationPreferences(prefs.notifications));
    }
  }, [prefs?.notifications]);

  return (
    <div className="space-y-4">
      <Card className="settings-panel border-primary/15 bg-primary/5 shadow-elegant">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            O que já dispara alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="space-y-1.5 text-muted-foreground">
            {WORKING_TYPES.map((line) => (
              <li key={line} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
            <strong className="text-foreground">Agenda:</strong> {PENDING_TYPES[0]}. Os toggles
            abaixo já salvam sua preferência; os lembretes aparecem quando o administrador do
            projeto agendar o job no Supabase.
          </p>
        </CardContent>
      </Card>

      <Card className="settings-panel shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Preferências no sino
          </CardTitle>
          <CardDescription>
            Cada alerta respeita seu cargo (módulos que você pode ver) e estas opções. A criação
            real das notificações é feita no servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {NOTIFICATION_PREF_GROUPS.map((group) => (
            <div key={group.category} className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <p className="text-xs text-muted-foreground">{group.description}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.fields.map((field) => {
                  const cat = group.category as NotificationPrefCategory;
                  const checked =
                    notificationPrefs[cat][field.key as keyof (typeof notificationPrefs)[typeof cat]];
                  return (
                    <div
                      key={field.key}
                      className="settings-notif-row flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 p-4"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <Label htmlFor={`notif-${group.category}-${field.key}`} className="text-sm">
                          {field.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      </div>
                      <Switch
                        id={`notif-${group.category}-${field.key}`}
                        checked={checked}
                        disabled={!canEdit}
                        className="shrink-0"
                        onCheckedChange={(value) => {
                          const next: NotificationPreferences = {
                            ...notificationPrefs,
                            [cat]: {
                              ...notificationPrefs[cat],
                              [field.key]: value,
                            },
                          };
                          setNotificationPrefs(next);
                          void upsertUserPreferences(tenantId, {
                            notifications: notificationPreferencesToJson(next),
                          }).then(() => {
                            void qc.invalidateQueries({ queryKey: queryKeys.prefs(tenantId) });
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
