import type {FeedbackFiltersState,FeedbackStatusFilter,} from '../../types/feedbackTypes';

interface FeedbackFiltersProps {
  filters: FeedbackFiltersState;

  onChange: (
    filters: FeedbackFiltersState
  ) => void;
}

export const FeedbackFilters = ({
  filters,
  onChange,
}: FeedbackFiltersProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Search */}
      <input
        type="text"
        value={filters.search}
        onChange={(event) =>
          onChange({
            ...filters,
            search: event.target.value,
          })
        }
        placeholder="Search system feedback..."
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
      />

      {/* Status Filter */}
      <select
        value={filters.status}
        onChange={(event) =>
          onChange({
            ...filters,
            status:
              event.target
                .value as FeedbackStatusFilter,
          })
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500"
      >
        <option value="ALL">
          All Statuses
        </option>

        <option value="ACTIVE">
          Active
        </option>

        <option value="PENDING_APPROVAL">
          Pending Approval
        </option>

        <option value="HIDDEN">
          Hidden
        </option>
      
      </select>
    </div>
  );
};