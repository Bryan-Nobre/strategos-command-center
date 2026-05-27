import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getUnreadNotificationCount,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";

export function useNotifications(tenantId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications(tenantId),
    queryFn: () => listMyNotifications(tenantId, 25),
    enabled: enabled && !!tenantId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationCount(tenantId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.notificationCount(tenantId),
    queryFn: () => getUnreadNotificationCount(tenantId),
    enabled: enabled && !!tenantId,
    staleTime: 15_000,
    refetchInterval: 45_000,
  });
}

export function useMarkNotificationRead(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications(tenantId) });
      void qc.invalidateQueries({ queryKey: queryKeys.notificationCount(tenantId) });
    },
  });
}

export function useMarkAllNotificationsRead(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(tenantId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications(tenantId) });
      void qc.invalidateQueries({ queryKey: queryKeys.notificationCount(tenantId) });
    },
  });
}
