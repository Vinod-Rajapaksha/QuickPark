import React from "react";

interface RangeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  disabled?: boolean;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue,
  disabled = false,
}) => (
  <div>
    <div className="flex items-center justify-between gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <span className="text-sm font-semibold text-blue-600">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      className="mt-2 w-full accent-blue-600 disabled:opacity-50"
      aria-label={label}
    />
  </div>
);

export default RangeSlider;
