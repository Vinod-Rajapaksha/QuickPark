import { useCallback, useEffect, useMemo, useState } from "react";
import { feedbackAdminApi } from "../api/feedbackAdminApi";
import { feedbackReplyApi } from "../api/feedbackReplyApi";
import type { Feedback, FeedbackReport } from "../types/feedbackTypes";

export const useAdminFeedback = () => {
  const [activeFeedbacks, setActiveFeedbacks] = useState<Feedback[]>([]);

  const [pendingFeedbacks, setPendingFeedbacks] = useState<Feedback[]>([]);

  const [hiddenFeedbacks, setHiddenFeedbacks] = useState<Feedback[]>([]);

  const [reports, setReports] = useState<FeedbackReport[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isActionLoading, setIsActionLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [activeData, pendingData, hiddenData, reportData] =
        await Promise.all([
          feedbackAdminApi.getActive(),
          feedbackAdminApi.getPending(),
          feedbackAdminApi.getHidden(),
          feedbackAdminApi.getReports(),
        ]);

      setActiveFeedbacks(activeData);
      setPendingFeedbacks(pendingData);
      setHiddenFeedbacks(hiddenData);
      setReports(reportData);
    } catch (error) {
      console.error("Failed to load admin feedback:", error);

      setError("Unable to load feedback management data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [fetchData]);

  const feedbacks = useMemo(() => {
    const feedbackMap = new Map<string, Feedback>();

    [...pendingFeedbacks, ...activeFeedbacks, ...hiddenFeedbacks].forEach(
      (feedback) => {
        feedbackMap.set(feedback.id, feedback);
      },
    );

    return Array.from(feedbackMap.values());
  }, [activeFeedbacks, pendingFeedbacks, hiddenFeedbacks]);

  const runAction = async (action: () => Promise<void>) => {
    try {
      setIsActionLoading(true);
      setError(null);

      await action();

      await fetchData();
    } catch (error) {
      console.error("Feedback moderation action failed:", error);

      setError("The feedback action could not be completed.");

      throw error;
    } finally {
      setIsActionLoading(false);
    }
  };

  const approveFeedback = async (id: string) => {
    await runAction(() => feedbackAdminApi.approve(id));
  };

  const hideFeedback = async (id: string) => {
    await runAction(() => feedbackAdminApi.hide(id));
  };

  const restoreFeedback = async (id: string) => {
    await runAction(() => feedbackAdminApi.restore(id));
  };

  const removeFeedback = async (id: string) => {
    await runAction(() => feedbackAdminApi.remove(id));
  };

  const replyToFeedback = async (feedbackId: string, message: string) => {
    try {
      setIsActionLoading(true);
      setError(null);

      await feedbackReplyApi.create({
        feedbackId,
        message,
      });

      await fetchData();
    } catch (error) {
      console.error("Failed to send feedback reply:", error);

      setError("Unable to send reply.");

      throw error;
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    feedbacks,

    activeFeedbacks,
    pendingFeedbacks,
    hiddenFeedbacks,
    reports,

    isLoading,
    isActionLoading,
    error,

    fetchData,

    approveFeedback,
    hideFeedback,
    restoreFeedback,
    removeFeedback,
    replyToFeedback,
  };
};
