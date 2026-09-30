import { MessageCircleMore, Quote } from 'lucide-react';
import { Card } from '../../../../components/common/Card/Card';
import type { Feedback } from '../../types/feedbackTypes';
import { StarRating } from '../shared/StarRating';

interface ApprovedFeedbackCardProps {
  feedback: Feedback;
}

export const ApprovedFeedbackCard = ({
  feedback,
}: ApprovedFeedbackCardProps) => {
  return (
    <Card className="h-full p-6">
      <div className="flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
              <Quote className="h-5 w-5 text-emerald-600" />
            </div>

            <h3 className="font-semibold text-slate-900">
              {feedback.userName}
            </h3>
          </div>

          <StarRating rating={feedback.rating} />
        </div>

        <p className="flex-1 text-sm leading-7 text-slate-600">
          “{feedback.comment || 'No comment provided.'}”
        </p>

        {(feedback.replies?.length ?? 0) > 0 && (
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <MessageCircleMore size={15} />

              QuickPark response
            </div>

            {(feedback.replies ?? []).map((reply) => (
              <div
                key={reply.id}
                className="rounded-xl bg-slate-50 p-4"
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-800">
                    QuickPark Team
                  </span>

                  <span className="text-xs text-slate-400">
                    {new Date(
                      reply.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm leading-6 text-slate-600">
                  {reply.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};