import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications";
import type { TenantNotification } from "@/services/notifications";

const severityDot: Record<TenantNotification["severity"], string> = {
  info: "bg-primary",
  warning: "bg-warning",
  critical: "bg-destructive",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

type NotificationBellProps = {
  tenantId: string;
  className?: string;
};

export function NotificationBell({ tenantId, className }: NotificationBellProps) {
  const navigate = useNavigate();
  const { data: count = 0 } = useUnreadNotificationCount(tenantId, !!tenantId);
  const { data: items = [], isLoading, isFetching } = useNotifications(tenantId, !!tenantId);
  const markRead = useMarkNotificationRead(tenantId);
  const markAll = useMarkAllNotificationsRead(tenantId);

  async function openNotification(n: TenantNotification) {
    if (!n.read_at) {
      await markRead.mutateAsync(n.id);
    }
    if (n.action_route) {
      void navigate({
        to: n.action_route,
        search: n.action_search,
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)} aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)]">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notificações</span>
          {(isFetching || isLoading) && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">Carregando…</div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhuma notificação no momento.
          </div>
        )}
        {!isLoading &&
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn(
                "flex cursor-pointer flex-col items-start gap-1 py-2.5",
                !n.read_at && "bg-muted/40",
              )}
              onClick={() => void openNotification(n)}
            >
              <div className="flex w-full items-start gap-2">
                <span
                  className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", severityDot[n.severity])}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatWhen(n.created_at)}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        {items.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-xs font-medium"
              disabled={markAll.isPending || count === 0}
              onClick={(e) => {
                e.preventDefault();
                markAll.mutate();
              }}
            >
              <CheckCheck className="mr-2 h-3.5 w-3.5" />
              Marcar todas como lidas
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
