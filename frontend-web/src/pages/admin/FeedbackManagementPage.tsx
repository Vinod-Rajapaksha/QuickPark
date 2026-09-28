import { useMemo, useState } from 'react';

import {
  MessageSquareText,
  RefreshCw,
} from 'lucide-react';

import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';
import Spinner from '../../components/common/Spinner/Spinner';

import { FeedbackStats } from '../../features/feedback/components/admin/FeedbackStats';
import { FeedbackFilters } from '../../features/feedback/components/admin/FeedbackFilters';
import { FeedbackTable } from '../../features/feedback/components/admin/FeedbackTable';
import { FeedbackDetailsDialog } from '../../features/feedback/components/admin/FeedbackDetailsDialog';
import { FeedbackModerationDialog } from '../../features/feedback/components/admin/FeedbackModerationDialog';

import { useAdminFeedback } from '../../features/feedback/hooks/useAdminFeedback';

import type {
  Feedback,
  FeedbackFiltersState,
} from '../../features/feedback/types/feedbackTypes';

type ConfirmAction =
  | {
      type: 'HIDE';
      feedback: Feedback;
    }
  | {
      type: 'DELETE';
      feedback: Feedback;
    }
  | null;

export default function FeedbackManagementPage() {
  const {
    feedbacks,
    isLoading,
    isActionLoading,
    error,
    fetchData,
    approveFeedback,
    hideFeedback,
    removeFeedback,
    restoreFeedback,
    replyToFeedback,
  } = useAdminFeedback();

  const [filters, setFilters] =
    useState<FeedbackFiltersState>({
      search: '',
      status: 'ALL',
    });

  const [selectedFeedback, setSelectedFeedback] =
    useState<Feedback | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [moderationOpen, setModerationOpen] =
    useState(false);

  const [confirmAction, setConfirmAction] =
    useState<ConfirmAction>(null);

  /*
   * Platform Admin Feedback Management
   * displays SYSTEM feedback only.
   *
   * PARKING feedback is intentionally excluded.
   */
  const systemFeedbacks = useMemo(
    () =>
      feedbacks.filter(
        (feedback) =>
          feedback.type === 'SYSTEM'
      ),
    [feedbacks]
  );

  /*
   * Search and status filtering are applied
   * only to SYSTEM feedback.
   */
  const filteredFeedbacks = useMemo(() => {
    const search =
      filters.search
        .trim()
        .toLowerCase();

    return systemFeedbacks.filter(
      (feedback) => {
        const matchesSearch =
          !search ||
          feedback.userName
            .toLowerCase()
            .includes(search) ||
          feedback.comment
            ?.toLowerCase()
            .includes(search);

        const matchesStatus =
          filters.status === 'ALL' ||
          feedback.status ===
            filters.status;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [systemFeedbacks, filters]);

  const openDetails = (
    feedback: Feedback
  ) => {
    setSelectedFeedback(feedback);
    setDetailsOpen(true);
  };

  const openModeration = (
    feedback: Feedback
  ) => {
    if (feedback.type !== 'SYSTEM') {
      return;
    }

    setSelectedFeedback(feedback);
    setModerationOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction) {
      return;
    }

    if (
      confirmAction.type === 'HIDE'
    ) {
      await hideFeedback(
        confirmAction.feedback.id
      );
    }

    if (
      confirmAction.type === 'DELETE'
    ) {
      await removeFeedback(
        confirmAction.feedback.id
      );
    }

    setConfirmAction(null);
  };

  const handleRestore = async (
    feedback: Feedback,
  ) => {
    await restoreFeedback(feedback.id);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (
    error &&
    systemFeedbacks.length === 0
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Unable to load feedback
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <div className="mt-5">
            <Button
              variant="secondary"
              onClick={() =>
                void fetchData()
              }
            >
              <RefreshCw size={17} />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <MessageSquareText
              size={18}
            />

            System Feedback Management
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Manage system feedback
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review QuickPark system
            feedback, approve public
            feedback, respond to users,
            hide feedback and remove
            inappropriate feedback.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() =>
            void fetchData()
          }
          disabled={isLoading}
        >
          <RefreshCw size={17} />
          Refresh
        </Button>
      </div>

      {/* SYSTEM feedback statistics only */}
      <FeedbackStats
        feedbacks={systemFeedbacks}
      />

      {/* Search and status filter */}
      <Card className="p-5">
        <FeedbackFilters
          filters={filters}
          onChange={setFilters}
        />
      </Card>

      {/* SYSTEM feedback table only */}
      <FeedbackTable
        feedbacks={
          filteredFeedbacks
        }
        onView={openDetails}
        onReply={openModeration}
        onRestore={handleRestore}
        onHide={(feedback) =>
          setConfirmAction({
            type: 'HIDE',
            feedback,
          })
        }
        onDelete={(feedback) =>
          setConfirmAction({
            type: 'DELETE',
            feedback,
          })
        }
      />

      {/* Feedback details */}
      <FeedbackDetailsDialog
        feedback={selectedFeedback}
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedFeedback(null);
        }}
      />

      {/* SYSTEM feedback moderation */}
      <FeedbackModerationDialog
        feedback={selectedFeedback}
        isOpen={moderationOpen}
        isLoading={isActionLoading}
        onClose={() => {
          setModerationOpen(false);
          setSelectedFeedback(null);
        }}
        onReply={replyToFeedback}
        onApprove={approveFeedback}
      />

      {/* Hide / Remove confirmation */}
      <ConfirmDialog
        isOpen={
          confirmAction !== null
        }
        title={
          confirmAction?.type ===
          'DELETE'
            ? 'Remove feedback?'
            : 'Hide feedback?'
        }
        description={
          confirmAction?.type ===
          'DELETE'
            ? 'This system feedback will be removed and will no longer be publicly available.'
            : 'This system feedback will be hidden from the public landing page.'
        }
        confirmText={
          confirmAction?.type ===
          'DELETE'
            ? 'Remove Feedback'
            : 'Hide Feedback'
        }
        cancelText="Cancel"
        type={
          confirmAction?.type ===
          'DELETE'
            ? 'danger'
            : 'warning'
        }
        isLoading={
          isActionLoading
        }
        onClose={() =>
          setConfirmAction(null)
        }
        onConfirm={() =>
          void handleConfirm()
        }
      />
    </div>
  );
}