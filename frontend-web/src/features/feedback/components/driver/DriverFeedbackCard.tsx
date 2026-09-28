import {MessageSquareReply, Pencil, Trash2,} from "lucide-react";
import Button from "../../../../components/common/Button/Button";
import type {Feedback,} from "../../types/feedbackTypes";
import { StarRating } from "../shared/StarRating";

interface DriverFeedbackCardProps {
  feedback: Feedback;

  onEdit: (
    feedback: Feedback,
  ) => void;

  onDelete: (
    feedback: Feedback,
  ) => void;
}

export const DriverFeedbackCard = ({
  feedback,
  onEdit,
  onDelete,
}: DriverFeedbackCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            Parking Feedback
          </p>

          <div className="mt-2">
            <StarRating
              rating={feedback.rating}
            />
          </div>
        </div>
      </div>

      {feedback.comment && (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {feedback.comment}
        </p>
      )}

      {feedback.keywords.length >
        0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {feedback.keywords.map(
            (keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {keyword.replaceAll(
                  "_",
                  " ",
                )}
              </span>
            ),
          )}
        </div>
      )}

      {(feedback.replies?.length ??
        0) > 0 && (
        <div className="mt-5 rounded-xl bg-primary-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary-800">
            <MessageSquareReply
              size={17}
            />

            Provider Replies
          </div>

          <div className="space-y-3">
            {feedback.replies.map(
              (reply) => (
                <div
                  key={reply.id}
                  className="text-sm leading-6 text-slate-600"
                >
                  <span className="font-medium text-slate-800">
                    {reply.role.replaceAll(
                      "_",
                      " ",
                    )}
                    :
                  </span>{" "}
                  {reply.message}
                </div>
              ),
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onEdit(feedback)
          }
        >
          <Pencil size={15} />
          Edit
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={() =>
            onDelete(feedback)
          }
        >
          <Trash2 size={15} />
          Remove
        </Button>
      </div>
    </div>
  );
};