import type { AppNotification } from "../types/notificationTypes";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// The inbox is read minutes after the rule sweep wrote it, so a clock time tells the owner
// more than a date. `now` is a parameter for the same reason the rest of the utils take input.
export const formatNotificationTime = (
  iso: string,
  now: Date = new Date(),
): string => {
  const created = new Date(iso);
  const elapsed = now.getTime() - created.getTime();

  if (!Number.isFinite(elapsed)) return "";
  if (elapsed < MINUTE_MS) return "just now";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;

  return created.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export const unreadCountFor = (notifications: AppNotification[]): number =>
  notifications.filter((notification) => !notification.isRead).length;

// Long enough to scan in a dropdown, short enough that the panel never has to truncate.
export const bellLabel = (unreadCount: number): string =>
  unreadCount === 0
    ? "No unread updates"
    : `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`;
