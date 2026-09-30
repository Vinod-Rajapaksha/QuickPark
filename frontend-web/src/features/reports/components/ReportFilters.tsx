import React, { useState } from "react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import Select from "../../parking/components/FormSelect";
import { describeWindow, PERIOD_OPTIONS, ReportPeriod } from "../utils/reportUtils";
import type { CustomRange, PeriodWindow, ReportPeriodKey } from "../utils/reportUtils";

export interface ReportFiltersProps {
  period: ReportPeriodKey;
  custom: CustomRange;
  bounds: PeriodWindow;
  onChangePeriod: (value: string) => void;
  onApplyCustom: (range: CustomRange) => void;
  onReset: () => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  period,
  custom,
  bounds,
  onChangePeriod,
  onApplyCustom,
  onReset,
}) => {
  const [draft, setDraft] = useState<CustomRange>(custom);

  const resetAll = (): void => {
    setDraft({});
    onReset();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,14rem)_auto_auto_auto]">
        <Select
          label="Reporting period"
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(event) => onChangePeriod(event.target.value)}
        />

        {period === ReportPeriod.CUSTOM && (
          <>
            <Input
              label="From"
              aria-label="From"
              type="date"
              value={draft.from ?? ""}
              onChange={(event) => setDraft({ ...draft, from: event.target.value })}
            />
            <Input
              label="To"
              aria-label="To"
              type="date"
              value={draft.to ?? ""}
              onChange={(event) => setDraft({ ...draft, to: event.target.value })}
            />
          </>
        )}

        <div className="flex items-end gap-2">
          {period === ReportPeriod.CUSTOM && (
            <Button type="button" size="sm" onClick={() => onApplyCustom(draft)}>
              Apply
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={resetAll}>
            Reset
          </Button>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Counted over {describeWindow(bounds)}. Both end dates are included.
      </p>
    </div>
  );
};

export default ReportFilters;
