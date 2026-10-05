import React from "react";

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: FormSelectOption[];
  // Listed while nothing is picked yet, so an empty value can mean "let the system choose".
  placeholder?: string;
  hint?: string;
  error?: string;
}

// The shared Select is a controlled custom dropdown
const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, options, placeholder, hint, error, className = "", required, ...props }, ref) => {
    const id =
      props.id ??
      (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : undefined);

    return (
      <div className={`flex w-full flex-col gap-1.5 ${className}`}>
        {label && (
          <label
            htmlFor={id}
            className="flex items-center gap-1 text-sm font-medium text-slate-700"
          >
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={id}
            required={required}
            aria-invalid={error ? true : undefined}
            className={`
              w-full appearance-none rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm
              text-slate-900 transition-all duration-200
              focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
              disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
              ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }
            `}
            {...props}
          >
            {placeholder !== undefined && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 text-slate-400"
          >
            ▾
          </span>
        </div>

        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

FormSelect.displayName = "FormSelect";

export default FormSelect;
