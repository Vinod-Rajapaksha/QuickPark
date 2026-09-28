import { useCallback, useEffect, useMemo, useState } from "react";
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
    } catch (error) {
      console.error("Failed to load feedback:", error);

      setError("Unable to load feedback.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void fetchFeedbacks();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [fetchFeedbacks]);

  const approvedSystemFeedbacks = useMemo(
    () =>
      feedbacks.filter(
        (feedback) =>
          feedback.type === "SYSTEM" && feedback.status === "ACTIVE",
      ),
    [feedbacks],
  );

  const createSystemFeedback = async (request: CreateSystemFeedbackRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const created = await feedbackApi.createSystemFeedback(request);

      return created;
    } catch (error) {
      console.error("Failed to submit system feedback:", error);

      setError("Unable to submit feedback.");

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

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
