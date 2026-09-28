import { axiosClient } from "../../../services/api/axiosClient";

import type {
  CreateSystemFeedbackRequest,
  Feedback,
  CreateParkingFeedbackRequest,
  UpdateFeedbackRequest,
  FeedbackKeywordType,
} from "../types/feedbackTypes";

import {
  mapFeedbackFromApi,
  mapFeedbackListFromApi,
} from "../utils/feedbackMapper";

const FEEDBACK_ENDPOINT = "/Feedback";

/*
 * Backend enum values
 *
 * FeedbackType:
 * PARKING = 0
 * SYSTEM = 1
 */
const FeedbackTypeApiValue = {
  PARKING: 0,
  SYSTEM: 1,
} as const;

/*
 * Backend FeedbackKeywordType:
 *
 * SAFE = 0
 * CLEAN = 1
 * USER_FRIENDLY = 2
 * GOOD_LOCATION = 3
 * AFFORDABLE = 4
 */
const FeedbackKeywordApiValue: Record<FeedbackKeywordType, number> = {
  SAFE: 0,
  CLEAN: 1,
  USER_FRIENDLY: 2,
  GOOD_LOCATION: 3,
  AFFORDABLE: 4,
};

const mapKeywordsToApi = (
  keywords: FeedbackKeywordType[] | null,
): number[] | null => {
  if (!keywords) {
    return null;
  }

  return keywords.map((keyword) => FeedbackKeywordApiValue[keyword]);
};

export const feedbackApi = {
  getAll: async (): Promise<Feedback[]> => {
    const response = await axiosClient.get(FEEDBACK_ENDPOINT);

    return mapFeedbackListFromApi(response.data);
  },

  getById: async (id: string): Promise<Feedback> => {
    const response = await axiosClient.get(`${FEEDBACK_ENDPOINT}/${id}`);

    return mapFeedbackFromApi(response.data);
  },

  createSystemFeedback: async (
    data: CreateSystemFeedbackRequest,
  ): Promise<Feedback> => {
    const response = await axiosClient.post(FEEDBACK_ENDPOINT, {
      ...data,

      type: FeedbackTypeApiValue.SYSTEM,
    });

    return mapFeedbackFromApi(response.data);
  },

  getMyParkingFeedback: async (): Promise<Feedback[]> => {
    const response = await axiosClient.get(`${FEEDBACK_ENDPOINT}/my-parking`);

    return mapFeedbackListFromApi(response.data);
  },

  createParkingFeedback: async (
    data: CreateParkingFeedbackRequest,
  ): Promise<Feedback> => {
    const response = await axiosClient.post(FEEDBACK_ENDPOINT, {
      ...data,

      type: FeedbackTypeApiValue.PARKING,

      keywords: mapKeywordsToApi(data.keywords),
    });

    return mapFeedbackFromApi(response.data);
  },

  update: async (
    id: string,
    data: UpdateFeedbackRequest,
  ): Promise<Feedback> => {
    const response = await axiosClient.put(`${FEEDBACK_ENDPOINT}/${id}`, {
      ...data,

      keywords: mapKeywordsToApi(data.keywords),
    });

    return mapFeedbackFromApi(response.data);
  },

  remove: async (id: string): Promise<void> => {
    await axiosClient.delete(`${FEEDBACK_ENDPOINT}/${id}`);
  },
};
