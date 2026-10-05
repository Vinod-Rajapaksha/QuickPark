export const FeedbackType = {
  PARKING: "PARKING",
  SYSTEM: "SYSTEM",
} as const;

export type FeedbackType = (typeof FeedbackType)[keyof typeof FeedbackType];

export const FeedbackStatus = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  HIDDEN: "HIDDEN",
  REMOVED: "REMOVED",
} as const;

export type FeedbackStatus =
  (typeof FeedbackStatus)[keyof typeof FeedbackStatus];

export const FeedbackKeywordType = {
  SAFE: "SAFE",
  CLEAN: "CLEAN",
  USER_FRIENDLY: "USER_FRIENDLY",
  GOOD_LOCATION: "GOOD_LOCATION",
  AFFORDABLE: "AFFORDABLE",
} as const;

export type FeedbackKeywordType =
  (typeof FeedbackKeywordType)[keyof typeof FeedbackKeywordType];

export interface FeedbackReply {
  id: string;
  repliedByUserId: string;
  role: string;
  message: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  userName: string;
  type: FeedbackType;
  parkingId: string | null;
  reservationId: string | null;
  rating: number;
  comment: string | null;
  status: FeedbackStatus;
  keywords: FeedbackKeywordType[];
  replies: FeedbackReply[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateParkingFeedbackRequest {
  type: "PARKING";
  parkingId: string;
  reservationId: string;
  rating: number;
  comment: string;
  keywords: FeedbackKeywordType[];
}

export interface CreateSystemFeedbackRequest {
  type: "SYSTEM";
  parkingId: null;
  reservationId: null;
  rating: number;
  comment: string;
  keywords: null;
}

export interface UpdateFeedbackRequest {
  rating: number;
  comment: string;
  keywords: FeedbackKeywordType[] | null;
}

export interface CreateFeedbackReplyRequest {
  feedbackId: string;
  message: string;
}

export interface FeedbackReport {
  id: string;
  feedbackId: string;
  reporterUserId: string;
  reporterName: string;
  feedbackComment: string;
  reason: string;
  createdAt: string;
}

export type FeedbackTypeFilter = "ALL" | "SYSTEM" | "PARKING";

export type FeedbackStatusFilter =
  "ALL" | "PENDING_APPROVAL" | "ACTIVE" | "HIDDEN" | "REMOVED";

export interface FeedbackFiltersState {
  search: string;
  status: FeedbackStatusFilter;
}
