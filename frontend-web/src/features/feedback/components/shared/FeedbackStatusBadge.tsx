import type { FeedbackStatus } from '../../types/feedbackTypes';

interface FeedbackStatusBadgeProps {
  status: FeedbackStatus;
}

const styles: Record<FeedbackStatus, string> = {
  ACTIVE:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20',

  PENDING_APPROVAL:
    'bg-amber-50 text-amber-700 ring-amber-600/20',

  HIDDEN:
    'bg-slate-100 text-slate-700 ring-slate-600/20',

  REMOVED:
    'bg-red-50 text-red-700 ring-red-600/20',
};

const labels: Record<FeedbackStatus, string> = {
  ACTIVE: 'Active',
  PENDING_APPROVAL: 'Pending Approval',
  HIDDEN: 'Hidden',
  REMOVED: 'Removed',
};

export const FeedbackStatusBadge = ({
  status,
}: FeedbackStatusBadgeProps) => {
  return (
    <span
      className={`
        inline-flex items-center rounded-full
        px-2.5 py-1 text-xs font-semibold
        ring-1 ring-inset
        ${styles[status]}
      `}
    >
      {labels[status]}
    </span>
  );
};