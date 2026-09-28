import { axiosClient } from "../../../services/api/axiosClient";
import type {
  CreateFeedbackReplyRequest,
  FeedbackReply,
} from "../types/feedbackTypes";

const REPLY_ENDPOINT = "/FeedbackReply";

export const feedbackReplyApi = {
  create: async (data: CreateFeedbackReplyRequest): Promise<FeedbackReply> => {
    const response = await axiosClient.post<FeedbackReply>(
      REPLY_ENDPOINT,
      data,
    );

    return response.data;
  },

  getByFeedbackId: async (feedbackId: string): Promise<FeedbackReply[]> => {
    const response = await axiosClient.get<FeedbackReply[]>(
      `${REPLY_ENDPOINT}/${feedbackId}`,
    );

    return response.data;
  },
};
