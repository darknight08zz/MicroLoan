import React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, helperText, error, children, className = "", id, disabled, ...props },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-wider text-[#111111]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`w-full py-2.5 pl-3.5 pr-10 text-sm text-[#111111] bg-[#ffffff] border rounded-[10px] appearance-none transition-colors focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] disabled:bg-[#f5f5f5] disabled:text-[#888888] disabled:cursor-not-allowed ${
              error
                ? "border-[#b42318] focus:border-[#b42318] focus:ring-[#b42318]"
                : "border-[#e5e5e5] hover:border-[#d4d4d4]"
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-[#666666]">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error ? (
          <p className="text-xs text-[#b42318] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#666666]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
