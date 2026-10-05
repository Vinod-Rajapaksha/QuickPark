export interface AppNotification {
  id: string;
  facilityId?: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}
