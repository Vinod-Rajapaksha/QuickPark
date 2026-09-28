import { axiosClient } from "../../../services/api/axiosClient";
import type { Feedback, FeedbackReport } from "../types/feedbackTypes";
import { mapFeedbackListFromApi } from "../utils/feedbackMapper";

const FEEDBACK_ENDPOINT = "/Feedback";

export const feedbackAdminApi = {
  getActive: async (): Promise<Feedback[]> => {
    const response = await axiosClient.get(FEEDBACK_ENDPOINT);

    return mapFeedbackListFromApi(response.data);
  },

  getPending: async (): Promise<Feedback[]> => {
    const response = await axiosClient.get(`${FEEDBACK_ENDPOINT}/pending`);

    return mapFeedbackListFromApi(response.data);
  },

  getHidden: async (): Promise<Feedback[]> => {
    const response = await axiosClient.get(`${FEEDBACK_ENDPOINT}/hidden`);

    return mapFeedbackListFromApi(response.data);
  },

  getReports: async (): Promise<FeedbackReport[]> => {
    const response = await axiosClient.get<FeedbackReport[]>(
      `${FEEDBACK_ENDPOINT}/reports`,
    );

    return response.data;
  },

  approve: async (id: string): Promise<void> => {
    await axiosClient.patch(`${FEEDBACK_ENDPOINT}/${id}/approve`);
  },

  hide: async (id: string): Promise<void> => {
    await axiosClient.patch(`${FEEDBACK_ENDPOINT}/${id}/hide`);
  },

  restore: async (id: string): Promise<void> => {
    await axiosClient.patch(`${FEEDBACK_ENDPOINT}/${id}/restore`);
  },

  remove: async (id: string): Promise<void> => {
    await axiosClient.delete(`${FEEDBACK_ENDPOINT}/admin/${id}`);
  },
};
