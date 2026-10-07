import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles: clean, compact, non-gradient, fast feedback
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer btn-interactive";

    // Strict monochromatic variant styles
    const variantStyles = {
      primary:
        "bg-[#111111] text-[#ffffff] hover:bg-[#2a2a2a] active:bg-[#000000] border border-transparent shadow-none",
      secondary:
        "bg-[#ffffff] text-[#111111] border border-[#d9d9d9] hover:bg-[#f5f5f5] active:bg-[#eeeeee]",
      outline:
        "bg-transparent text-[#111111] border border-[#e5e5e5] hover:bg-[#fafafa] active:bg-[#f5f5f5]",
      ghost:
        "bg-transparent text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] active:bg-[#eeeeee]",
      danger:
        "bg-[#b42318] text-[#ffffff] hover:bg-[#911d13] active:bg-[#7a1810] border border-transparent",
    };

    // Sizes: compact and editorial
    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-[8px] gap-1.5",
      md: "px-4 py-2 text-sm rounded-[10px] gap-2",
      lg: "px-6 py-3 text-base rounded-[10px] gap-2.5 font-semibold",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
