import React from "react";
import { Check } from "lucide-react";
import type { AppNotification } from "../types/notificationTypes";
import { formatNotificationTime } from "../utils/notificationUtils";

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (notificationId: string) => void | Promise<unknown>;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
}) => (
  <li
    className={`px-4 py-3 ${notification.isRead ? "bg-white" : "bg-blue-50/60"}`}
  >
    <div className="flex items-start justify-between gap-3">
      <p className="flex items-start gap-2 text-sm font-medium text-slate-800">
        {!notification.isRead && (
          <span
            aria-label="Unread"
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600"
          />
        )}
        {notification.title}
      </p>
      <span className="shrink-0 text-xs text-slate-400">
        {formatNotificationTime(notification.createdAt)}
      </span>
    </div>
    <p className="mt-1 pl-4 text-sm text-slate-600">
      {notification.body}
    </p>
    {!notification.isRead && (
      <button
        type="button"
        onClick={() => void onMarkRead(notification.id)}
        className="mt-2 flex items-center gap-1 pl-4 text-xs font-medium text-blue-700 hover:text-blue-800"
      >
        <Check size={14} />
        Mark as read
      </button>
    )}
  </li>
);

export default NotificationItem;
