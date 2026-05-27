import { createClient } from "@/lib/supabase/client";

export type TenantNotification = {
  id: string;
  type: string;
  category: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action_route: string | null;
  action_search: Record<string, string>;
  read_at: string | null;
  created_at: string;
};

type RawNotification = {
  id: string;
  type: string;
  category: string;
  severity: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action_route: string | null;
  action_search: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: RawNotification): TenantNotification {
  const search: Record<string, string> = {};
  if (row.action_search && typeof row.action_search === "object") {
    for (const [k, v] of Object.entries(row.action_search)) {
      if (typeof v === "string") search[k] = v;
    }
  }

  const severity =
    row.severity === "warning" || row.severity === "critical" ? row.severity : "info";

  return {
    id: row.id,
    type: row.type,
    category: row.category,
    severity,
    title: row.title,
    body: row.body,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    action_route: row.action_route,
    action_search: search,
    read_at: row.read_at,
    created_at: row.created_at,
  };
}

export async function listMyNotifications(
  tenantId: string,
  limit = 20,
  unreadOnly = false,
): Promise<TenantNotification[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_my_notifications", {
    p_tenant_id: tenantId,
    p_limit: limit,
    p_unread_only: unreadOnly,
  });
  if (error) throw error;

  const rows = (data ?? []) as RawNotification[];
  return rows.map(mapNotification);
}

export async function getUnreadNotificationCount(tenantId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_unread_notification_count", {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return typeof data === "number" ? data : 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });
  if (error) throw error;
}

export async function markAllNotificationsRead(tenantId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("mark_all_notifications_read", {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return typeof data === "number" ? data : 0;
}

export async function notifySupporterImportCompleted(
  tenantId: string,
  count: number,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("notify_supporter_import_completed", {
    p_tenant_id: tenantId,
    p_count: count,
  });
  if (error) throw error;
}
