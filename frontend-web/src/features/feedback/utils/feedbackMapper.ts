import type {
  Feedback,
  FeedbackKeywordType,
  FeedbackStatus,
  FeedbackType,
} from "../types/feedbackTypes";

type FeedbackApiResponse = Omit<Feedback, "type" | "status" | "keywords"> & {
  type: FeedbackType | number;
  status: FeedbackStatus | number;
  keywords: Array<FeedbackKeywordType | number> | null;
};

const feedbackTypeMap: Record<number, FeedbackType> = {
  0: "PARKING",
  1: "SYSTEM",
};

const feedbackStatusMap: Record<number, FeedbackStatus> = {
  0: "PENDING_APPROVAL",
  1: "ACTIVE",
  2: "HIDDEN",
  3: "REMOVED",
};

const feedbackKeywordMap: Record<number, FeedbackKeywordType> = {
  0: "SAFE",
  1: "CLEAN",
  2: "USER_FRIENDLY",
  3: "GOOD_LOCATION",
  4: "AFFORDABLE",
};

const normalizeType = (type: FeedbackType | number): FeedbackType => {
  if (typeof type === "number") {
    const mapped = feedbackTypeMap[type];

    if (!mapped) {
      throw new Error(`Unknown feedback type: ${type}`);
    }

    return mapped;
  }

  return type;
};

const normalizeStatus = (status: FeedbackStatus | number): FeedbackStatus => {
  if (typeof status === "number") {
    const mapped = feedbackStatusMap[status];

    if (!mapped) {
      throw new Error(`Unknown feedback status: ${status}`);
    }

    return mapped;
  }

  return status;
};

const normalizeKeyword = (
  keyword: FeedbackKeywordType | number,
): FeedbackKeywordType => {
  if (typeof keyword === "number") {
    const mapped = feedbackKeywordMap[keyword];

    if (!mapped) {
      throw new Error(`Unknown feedback keyword: ${keyword}`);
    }

    return mapped;
  }

  return keyword;
};

export const mapFeedbackFromApi = (feedback: FeedbackApiResponse): Feedback => {
  return {
    ...feedback,

    type: normalizeType(feedback.type),

    status: normalizeStatus(feedback.status),

    keywords: (feedback.keywords ?? []).map(normalizeKeyword),

    replies: feedback.replies ?? [],
  };
};

export const mapFeedbackListFromApi = (
  feedbacks: FeedbackApiResponse[],
): Feedback[] => {
  return feedbacks.map(mapFeedbackFromApi);
};
