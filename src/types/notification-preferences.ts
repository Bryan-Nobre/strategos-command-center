/** Categorias de preferência de notificação in-app (JSON em user_preferences.notifications). */

export const NOTIFICATION_PREF_CATEGORIES = [
  "demands",
  "supporters",
  "agenda",
  "team",
] as const;

export type NotificationPrefCategory = (typeof NOTIFICATION_PREF_CATEGORIES)[number];

export type DemandsNotificationPrefs = {
  assigned_to_me: boolean;
  status_on_mine: boolean;
  new_open: boolean;
  unassigned_digest: boolean;
  high_priority: boolean;
};

export type SupportersNotificationPrefs = {
  landing_new: boolean;
  import_done: boolean;
};

export type AgendaNotificationPrefs = {
  event_today: boolean;
  event_tomorrow: boolean;
};

export type TeamNotificationPrefs = {
  invite_accepted: boolean;
  member_joined: boolean;
};

export type NotificationPreferences = {
  demands: DemandsNotificationPrefs;
  supporters: SupportersNotificationPrefs;
  agenda: AgendaNotificationPrefs;
  team: TeamNotificationPrefs;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  demands: {
    assigned_to_me: true,
    status_on_mine: true,
    new_open: false,
    unassigned_digest: true,
    high_priority: true,
  },
  supporters: {
    landing_new: true,
    import_done: true,
  },
  agenda: {
    event_today: true,
    event_tomorrow: true,
  },
  team: {
    invite_accepted: true,
    member_joined: true,
  },
};

export function parseNotificationPreferences(raw: unknown): NotificationPreferences {
  const base = structuredClone(DEFAULT_NOTIFICATION_PREFERENCES);
  if (!raw || typeof raw !== "object") return base;

  const obj = raw as Record<string, unknown>;

  for (const cat of NOTIFICATION_PREF_CATEGORIES) {
    const section = obj[cat];
    if (!section || typeof section !== "object") continue;
    for (const [key, val] of Object.entries(section as Record<string, unknown>)) {
      if (typeof val === "boolean" && cat in base && key in base[cat as NotificationPrefCategory]) {
        (base[cat as NotificationPrefCategory] as Record<string, boolean>)[key] = val;
      }
    }
  }

  return base;
}

export function notificationPreferencesToJson(
  prefs: NotificationPreferences,
): Record<string, Record<string, boolean>> {
  return {
    demands: { ...prefs.demands },
    supporters: { ...prefs.supporters },
    agenda: { ...prefs.agenda },
    team: { ...prefs.team },
  };
}
