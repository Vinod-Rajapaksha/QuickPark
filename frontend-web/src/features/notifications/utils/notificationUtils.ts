import type { AppNotification } from "../types/notificationTypes";

export const formatNotificationTime = (isoString: string, now: Date = new Date()): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const unreadCountFor = (notifications: AppNotification[]): number => {
  return notifications.filter((n) => !n.isRead).length;
};

export const bellLabel = (unreadCount: number): string => {
  if (unreadCount <= 0) return "No unread updates";
  if (unreadCount === 1) return "1 unread update";
  return `${unreadCount} unread updates`;
};
