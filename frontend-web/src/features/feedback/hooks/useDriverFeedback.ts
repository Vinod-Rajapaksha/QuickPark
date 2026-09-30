import { useCallback, useEffect, useState } from "react";
import { feedbackApi } from "../api/feedbackApi";
import type { Feedback, UpdateFeedbackRequest } from "../types/feedbackTypes";

export const useDriverFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await feedbackApi.getMyParkingFeedback();

      setFeedbacks(data);
    } catch {
      setError("Unable to load your parking feedback.");
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

  const updateFeedback = async (id: string, request: UpdateFeedbackRequest) => {
    try {
      setIsSubmitting(true);

      await feedbackApi.update(id, request);

      await fetchFeedbacks();
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFeedback = async (id: string) => {
    try {
      setIsSubmitting(true);

      await feedbackApi.remove(id);

      await fetchFeedbacks();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    feedbacks,
    isLoading,
    isSubmitting,
    error,

    fetchFeedbacks,
    updateFeedback,
    deleteFeedback,
  };
};
