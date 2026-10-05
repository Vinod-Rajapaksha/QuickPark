import {CheckCircle2,Clock3,MessageSquareText,Star,} from 'lucide-react';
import type { Feedback } from '../../types/feedbackTypes';

interface FeedbackStatsProps {
  feedbacks: Feedback[];
}

export const FeedbackStats = ({
  feedbacks,
}: FeedbackStatsProps) => {
  const active = feedbacks.filter(
    (item) => item.status === 'ACTIVE'
  ).length;

  const pending = feedbacks.filter(
    (item) =>
      item.status === 'PENDING_APPROVAL'
  ).length;

  const averageRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce(
            (total, item) =>
              total + item.rating,
            0
          ) / feedbacks.length
        ).toFixed(1)
      : '0.0';

  const stats = [
    {
      title: 'Visible Feedback',
      value: active,
      icon: CheckCircle2,
    },
    {
      title: 'Pending Approval',
      value: pending,
      icon: Clock3,
    },
    {
      title: 'Total Loaded',
      value: feedbacks.length,
      icon: MessageSquareText,
    },
    {
      title: 'Average Rating',
      value: averageRating,
      icon: Star,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon size={21} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};