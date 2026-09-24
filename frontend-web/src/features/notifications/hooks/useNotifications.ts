import { useCallback, useEffect, useState } from "react";
import { notificationApi } from "../api/notificationApi";
import type { AppNotification } from "../types/notificationTypes";
import { unreadCountFor } from "../utils/notificationUtils";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const inbox = await notificationApi.getMine();
      setNotifications(inbox.notifications);
    } catch {
      setLoadError("Your updates could not be loaded.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(async (notificationId: string) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    );
    try {
      await notificationApi.markRead(notificationId);
    } catch {
      void load();
    }
  }, [load]);

  const markAllRead = useCallback(async () => {
    setNotifications((current) =>
      current.map((item) => (item.isRead ? item : { ...item, isRead: true })),
    );
    try {
      await notificationApi.markAllRead();
    } catch {
      void load();
    }
  }, [load]);

  return {
    notifications,
    unreadCount: unreadCountFor(notifications),
    isLoading,
    isRefreshing,
    loadError,
    refresh: load,
    markRead,
    markAllRead,
  };
};
