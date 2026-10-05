import React from "react";
import Select from "../../../components/common/Select/Select";
import RangeSlider from "../../../components/common/RangeSlider/RangeSlider";
import { formatMoney } from "../utils/parkingUtils";
import type { SelectOption } from "../../../components/common/Select/Select";
import type { DiscoverySort } from "../hooks/useParkingDiscovery";

export const RATE_SLIDER_MIN = 0;
export const RATE_SLIDER_MAX = 5000;
export const RATE_SLIDER_STEP = 50;

const SORT_OPTIONS: SelectOption[] = [
  { value: "name", label: "Sort: Name (A-Z)" },
  { value: "priceAsc", label: "Sort: Price (low to high)" },
  { value: "priceDesc", label: "Sort: Price (high to low)" },
];

interface DiscoveryRateFiltersProps {
  hasEvCharging: boolean;
  onHasEvChargingChange: (value: boolean) => void;
  minRate: number;
  maxRate: number;
  onMinRateChange: (value: number) => void;
  onMaxRateChange: (value: number) => void;
  sort: DiscoverySort;
  onSortChange: (value: DiscoverySort) => void;
}

export const DiscoveryRateFilters: React.FC<DiscoveryRateFiltersProps> = ({
  hasEvCharging,
  onHasEvChargingChange,
  minRate,
  maxRate,
  onMinRateChange,
  onMaxRateChange,
  sort,
  onSortChange,
}) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
    <div>
      <Select
        options={SORT_OPTIONS}
        value={sort}
        onChange={(value) => onSortChange(value as DiscoverySort)}
      />
    </div>
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:justify-center">
      <input
        type="checkbox"
        checked={hasEvCharging}
        onChange={(event) => onHasEvChargingChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
      />
      EV charging only
    </label>
    <RangeSlider
      label="Minimum rate"
      value={minRate}
      onChange={onMinRateChange}
      min={RATE_SLIDER_MIN}
      max={RATE_SLIDER_MAX}
      step={RATE_SLIDER_STEP}
      formatValue={formatMoney}
    />
    <RangeSlider
      label="Maximum rate"
      value={maxRate}
      onChange={onMaxRateChange}
      min={RATE_SLIDER_MIN}
      max={RATE_SLIDER_MAX}
      step={RATE_SLIDER_STEP}
      formatValue={formatMoney}
    />
  </div>
);

export default DiscoveryRateFilters;
