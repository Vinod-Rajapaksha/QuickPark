// One message the platform leaves an account. The body is written server-side and already
// names the rule that changed and the value it moved to, so the UI never rebuilds a sentence.
export interface AppNotification {
  id: string;
  facilityId: string | null;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationInbox {
  unreadCount: number;
  notifications: AppNotification[];
}
