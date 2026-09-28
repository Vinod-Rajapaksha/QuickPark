import {MessageCircleMore,ParkingCircle,} from 'lucide-react';
import  Modal  from '../../../../components/common/Modal/Modal';
import { Badge } from '../../../../components/common/Badge/Badge';
import type { Feedback } from '../../types/feedbackTypes';
import { FeedbackStatusBadge } from '../shared/FeedbackStatusBadge';
import { StarRating } from '../shared/StarRating';

interface FeedbackDetailsDialogProps {
  feedback: Feedback | null;

  isOpen: boolean;

  onClose: () => void;
}

export const FeedbackDetailsDialog = ({
  feedback,
  isOpen,
  onClose,
}: FeedbackDetailsDialogProps) => {
  if (!feedback) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Feedback Details"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Submitted by
            </p>

            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {feedback.userName}
            </h3>
          </div>

          <FeedbackStatusBadge
            status={feedback.status}
          />
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-700">
              Rating
            </span>

            <StarRating
              rating={feedback.rating}
            />
          </div>

          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {feedback.comment ||
              'No comment provided.'}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Type
          </p>

          <Badge>
            {feedback.type}
          </Badge>
        </div>

        {feedback.parkingId && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <ParkingCircle className="mt-0.5 h-5 w-5 text-slate-400" />

            <div>
              <p className="text-sm font-medium text-slate-700">
                Parking Feedback
              </p>

              <p className="mt-1 break-all text-xs text-slate-500">
                {feedback.parkingId}
              </p>
            </div>
          </div>
        )}

        {feedback.keywords.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">
              Keywords
            </p>

            <div className="flex flex-wrap gap-2">
              {feedback.keywords.map(
                (keyword) => (
                  <Badge key={keyword}>
                    {keyword.replaceAll(
                      '_',
                      ' '
                    )}
                  </Badge>
                )
              )}
            </div>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center gap-2">
            <MessageCircleMore
              size={18}
              className="text-slate-500"
            />

            <h4 className="font-semibold text-slate-900">
              Replies
            </h4>
          </div>

          (feedback.replies?.length ?? 0) === 0? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No replies yet.
            </p>
          ) : (
            <div className="space-y-3">
              {feedback.replies.map(
                (reply) => (
                  <div
                    key={reply.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        {reply.role}
                      </span>

                      <span className="text-xs text-slate-400">
                        {new Date(
                          reply.createdAt
                        ).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      {reply.message}
                    </p>
                  </div>
                )
              )}
            </div>
          )
        </div>
      </div>
    </Modal>
  );
};