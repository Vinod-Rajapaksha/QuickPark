import React from "react";
import NotificationItem from "./NotificationItem";
import Spinner from "../../../components/common/Spinner/Spinner";
import type { AppNotification } from "../types/notificationTypes";

interface NotificationListProps {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
  onMarkRead: (notificationId: string) => void | Promise<unknown>;
  onMarkAllRead?: () => void | Promise<unknown>;
  onRefresh?: () => void | Promise<unknown>;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  isLoading,
  error,
  onMarkRead,
  onMarkAllRead,
  onRefresh,
}) => {
  const hasUnread = notifications.some((notification) => !notification.isRead);

  const header = (onMarkAllRead || onRefresh) && (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2">
      <button
        type="button"
        onClick={() => void onMarkAllRead?.()}
        disabled={!hasUnread}
        className="text-xs font-medium text-blue-700 hover:text-blue-800 disabled:text-slate-300"
      >
        Mark all read
      </button>
      {onRefresh && (
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={isLoading}
          className="text-xs text-slate-500 hover:text-slate-700 disabled:text-slate-300"
        >
          Refresh
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {header}
        <p className="px-4 py-6 text-sm text-red-600" role="alert">{error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div>
        {header}
        <p className="px-4 py-6 text-center text-sm text-slate-500">
          Nothing yet. When the platform admin changes a pricing rule or a standard bay, your
          properties are adjusted to match and a message like this one tells you what moved.
        </p>
      </div>
    );
  }

  return (
    <div>
      {header}
      <ul className="divide-y divide-slate-100">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={onMarkRead}
          />
        ))}
      </ul>
    </div>
  );
};

export default NotificationList;
