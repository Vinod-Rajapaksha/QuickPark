import { useCallback, useState } from "react";
import { feedbackApi } from "../api/feedbackApi";
import type {
  CreateSystemFeedbackRequest,
  Feedback,
} from "../types/feedbackTypes";

export const useFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await feedbackApi.getAll();

      setFeedbacks(data);
    } catch {
      setError("Unable to load feedback.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSystemFeedback = async (request: CreateSystemFeedbackRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const created = await feedbackApi.createSystemFeedback(request);

      return created;
    } catch (error) {
      setError("Unable to submit feedback.");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedSystemFeedbacks = feedbacks.filter(
    (feedback) => feedback.type === "SYSTEM" && feedback.status === "ACTIVE",
  );

  return {
    feedbacks,
    approvedSystemFeedbacks,
    isLoading,
    isSubmitting,
    error,
    fetchFeedbacks,
    createSystemFeedback,
  };
};
