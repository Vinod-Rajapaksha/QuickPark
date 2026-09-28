import { axiosClient } from "../../../services/api/axiosClient";
import type {
  CreateSystemFeedbackRequest,
  Feedback,
  CreateParkingFeedbackRequest,
  UpdateFeedbackRequest,
} from "../types/feedbackTypes";

const FEEDBACK_ENDPOINT = "/Feedback";

export const feedbackApi = {
  getAll: async (): Promise<Feedback[]> => {
    const response = await axiosClient.get<Feedback[]>(FEEDBACK_ENDPOINT);

    return response.data;
  },

  getById: async (id: string): Promise<Feedback> => {
    const response = await axiosClient.get<Feedback>(
      `${FEEDBACK_ENDPOINT}/${id}`,
    );

    return response.data;
  },

  createSystemFeedback: async (
    data: CreateSystemFeedbackRequest,
  ): Promise<Feedback> => {
    const response = await axiosClient.post<Feedback>(FEEDBACK_ENDPOINT, data);

    return response.data;
  },

  getMyParkingFeedback: async (): Promise<Feedback[]> => {
    const response = await axiosClient.get<Feedback[]>(
      `${FEEDBACK_ENDPOINT}/my-parking`,
    );

    return response.data;
  },

  createParkingFeedback: async (
    data: CreateParkingFeedbackRequest,
  ): Promise<Feedback> => {
    const response = await axiosClient.post<Feedback>(FEEDBACK_ENDPOINT, data);

    return response.data;
  },

  update: async (
    id: string,
    data: UpdateFeedbackRequest,
  ): Promise<Feedback> => {
    const response = await axiosClient.put<Feedback>(
      `${FEEDBACK_ENDPOINT}/${id}`,
      data,
    );

    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await axiosClient.delete(`${FEEDBACK_ENDPOINT}/${id}`);
  },
};
