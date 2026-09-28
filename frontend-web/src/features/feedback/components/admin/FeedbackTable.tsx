import {
  Eye,
  EyeOff,
  MessageSquareReply,
  Trash2,
} from 'lucide-react';

import Button from '../../../../components/common/Button/Button';

import type { Feedback } from '../../types/feedbackTypes';

import { FeedbackStatusBadge } from '../shared/FeedbackStatusBadge';
import { StarRating } from '../shared/StarRating';

interface FeedbackTableProps {
  feedbacks: Feedback[];

  onView: (feedback: Feedback) => void;

  onReply: (feedback: Feedback) => void;

  onHide: (feedback: Feedback) => void;

  onRestore: (feedback: Feedback) => void;

  onDelete: (feedback: Feedback) => void;
}

export const FeedbackTable = ({
  feedbacks,
  onView,
  onReply,
  onHide,
  onRestore,
  onDelete,
}: FeedbackTableProps) => {
  if (feedbacks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h3 className="font-semibold text-slate-900">
          No feedback found
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          There is no feedback matching the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                User
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rating
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Feedback
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {feedbacks.map((feedback) => (
              <tr
                key={feedback.id}
                className="transition hover:bg-slate-50/70"
              >
                <td className="whitespace-nowrap px-5 py-4">
                  <p className="font-medium text-slate-900">
                    {feedback.userName}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <span className="text-sm font-medium text-slate-600">
                    {feedback.type === 'SYSTEM'
                      ? 'System'
                      : 'Parking'}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <StarRating
                    rating={feedback.rating}
                    size={15}
                  />
                </td>

                <td className="max-w-xs px-5 py-4">
                  <p className="truncate text-sm text-slate-600">
                    {feedback.comment ||
                      'No comment provided'}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <FeedbackStatusBadge
                    status={feedback.status}
                  />
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onView(feedback)
                      }
                      title="View"
                    >
                      <Eye size={16} />
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onReply(feedback)
                      }
                      title="Reply"
                    >
                      <MessageSquareReply
                        size={16}
                      />
                    </Button>

                    {feedback.status ===
                      'ACTIVE' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          onHide(feedback)
                        }
                        title="Hide"
                      >
                        <EyeOff size={16} />
                      </Button>
                    )}

                    {feedback.status ===
                      'HIDDEN' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          onRestore(feedback)
                        }
                        title="Make visible"
                      >
                        <Eye size={16} />
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        onDelete(feedback)
                      }
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};