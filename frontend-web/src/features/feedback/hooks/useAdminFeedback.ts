import { useCallback, useEffect, useMemo, useState } from "react";
import { feedbackAdminApi } from "../api/feedbackAdminApi";
import { feedbackReplyApi } from "../api/feedbackReplyApi";
import type { Feedback, FeedbackReport } from "../types/feedbackTypes";

export const useAdminFeedback = () => {
  const [activeFeedbacks, setActiveFeedbacks] = useState<Feedback[]>([]);
  const [pendingFeedbacks, setPendingFeedbacks] = useState<Feedback[]>([]);
  const [reports, setReports] = useState<FeedbackReport[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [activeData, pendingData, reportData] = await Promise.all([
        feedbackAdminApi.getActive(),
        feedbackAdminApi.getPending(),
        feedbackAdminApi.getReports(),
      ]);

      setActiveFeedbacks(activeData);
      setPendingFeedbacks(pendingData);
      setReports(reportData);
    } catch {
      setError("Unable to load feedback management data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    void loadData();
  }, [fetchData]);

  const feedbacks = useMemo(() => {
    const map = new Map<string, Feedback>();

    [...pendingFeedbacks, ...activeFeedbacks].forEach((feedback) => {
      map.set(feedback.id, feedback);
    });

    return Array.from(map.values());
  }, [activeFeedbacks, pendingFeedbacks]);

  const runAction = async (action: () => Promise<void>) => {
    try {
      setIsActionLoading(true);
      setError(null);

      await action();
      await fetchData();
    } catch (error) {
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
