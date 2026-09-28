import { useState } from 'react';
import {
  MessageSquareHeart,
  Plus,
} from 'lucide-react';
import  Button  from '../../../../components/common/Button/Button';
import  Modal  from '../../../../components/common/Modal/Modal';
import { Skeleton } from '../../../../components/common/Skeleton/Skeleton';
import { useAuth } from '../../../../hooks/useAuth';
import { useFeedback } from '../../hooks/useFeedback';
import { ApprovedFeedbackCard } from './ApprovedFeedbackCard';
import { SystemFeedbackForm } from './SystemFeedbackForm';

export const FeedbackSection = () => {
  const { isAuthenticated } = useAuth();

  const {
    approvedSystemFeedbacks,
    isLoading,
    isSubmitting,
    createSystemFeedback,
  } = useFeedback();

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] =
    useState(false);

  const handleSubmit = async (
    rating: number,
    comment: string
  ) => {
    await createSystemFeedback({
      type: 'SYSTEM',
      parkingId: null,
      reservationId: null,
      rating,
      comment,
      keywords: null,
    });
  };

  return (
    <section
      id="feedback"
      className="bg-slate-50 py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Community feedback
            </span>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              What users think about QuickPark
            </h2>

            <p className="mt-3 max-w-2xl text-slate-500">
              Real experiences shared by people using
              QuickPark.
            </p>
          </div>

          {isAuthenticated && (
            <Button
              onClick={() =>
                setIsFeedbackModalOpen(true)
              }
            >
              <Plus size={18} />

              Give Feedback
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <Skeleton
                  key={index}
                  className="h-64 rounded-2xl"
                />
              )
            )}
          </div>
        ) : approvedSystemFeedbacks.length === 0 ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <MessageSquareHeart className="mx-auto h-10 w-10 text-primary-500" />

                    <h3 className="mt-4 font-semibold text-slate-900">
                        No feedback yet
                    </h3>

                <p className="mt-2 text-sm text-slate-500">
                    Approved QuickPark feedback will appear here.
                </p>
            </div>
          
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {approvedSystemFeedbacks
              .slice(0, 6)
              .map((feedback) => (
                <ApprovedFeedbackCard
                  key={feedback.id}
                  feedback={feedback}
                />
              ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() =>
          setIsFeedbackModalOpen(false)
        }
        title="Share your QuickPark experience"
      >
        <SystemFeedbackForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() =>
            setIsFeedbackModalOpen(false)
          }
        />
      </Modal>
    </section>
  );
};