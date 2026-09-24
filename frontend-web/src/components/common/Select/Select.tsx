import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      className = "",
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={`flex w-full flex-col gap-1.5 ${className}`}>
        {label && (
          <label className="flex items-center gap-1 text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            disabled={disabled}
            className={`
              w-full appearance-none rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm
              text-slate-900 transition-all duration-200
              focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
              disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
              ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 hover:border-slate-300"}
            `}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!error && hint && (
          <p className="text-xs text-slate-400">{hint}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
