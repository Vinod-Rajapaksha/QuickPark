import { axiosClient } from "../../../services/api/axiosClient";
import type { NotificationInbox } from "../types/notificationTypes";

const BASE = "/notifications";

export const notificationApi = {
  getMine: async (): Promise<NotificationInbox> => {
    const response = await axiosClient.get(BASE);
    return response.data;
  },

  markRead: async (notificationId: string): Promise<void> => {
    await axiosClient.put(`${BASE}/${notificationId}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await axiosClient.put(`${BASE}/read-all`);
  },
};
