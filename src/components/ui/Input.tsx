import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      prefixElement,
      suffixElement,
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[#111111] dark:text-[#F4F4F5] uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixElement && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#666666] dark:text-[#A1A1AA] text-sm font-medium">
              {prefixElement}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full py-2.5 text-sm text-[#111111] dark:text-[#F4F4F5] bg-[#ffffff] dark:bg-[#1E2026] border rounded-[10px] transition-colors placeholder:text-[#999999] dark:placeholder:text-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-white focus:border-[#111111] dark:focus:border-white disabled:bg-[#f5f5f5] dark:disabled:bg-[#18191E] disabled:text-[#888888] disabled:cursor-not-allowed ${
              prefixElement ? "pl-9" : "pl-3.5"
            } ${suffixElement ? "pr-12" : "pr-3.5"} ${
              error
                ? "border-[#b42318] dark:border-[#EA8A8A] focus:border-[#b42318] focus:ring-[#b42318]"
                : "border-[#e5e5e5] dark:border-white/[0.12] hover:border-[#d4d4d4]"
            } ${className}`}
            {...props}
          />
          {suffixElement && (
            <div className="absolute right-3.5 flex items-center text-[#666666] dark:text-[#A1A1AA] text-xs font-medium">
              {suffixElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#b42318] dark:text-[#EA8A8A] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#666666] dark:text-[#A1A1AA]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
