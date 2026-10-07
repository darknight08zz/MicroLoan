import React from "react";

export type BadgeVariant =
  | "requested"
  | "funded"
  | "withdrawn"
  | "repaid"
  | "defaulted"
  | "pending"
  | "active"
  | "warning"
  | "success"
  | "error"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className = "",
  ...props
}: BadgeProps) {
  // Restrained status colors applied ONLY to communicate system state:
  // Success: #16803C
  // Warning: #A16207
  // Error: #B42318
  // Neutral/Info: #4B5563 or #111111
  const variantStyles: Record<BadgeVariant, string> = {
    requested:
      "bg-[#f5f5f5] text-[#4b5563] border-[#e5e5e5] dark:bg-[#2A2315] dark:text-[#E0A34B] dark:border-[#443720]",
    pending:
      "bg-[#f5f5f5] text-[#4b5563] border-[#e5e5e5] dark:bg-[#2A2315] dark:text-[#E0A34B] dark:border-[#443720]",
    funded:
      "bg-[#f5f5f5] text-[#111111] border-[#d4d4d4] font-medium dark:bg-[#172433] dark:text-[#82AEE6] dark:border-[#263852]",
    active:
      "bg-[#f5f5f5] text-[#111111] border-[#d4d4d4] font-medium dark:bg-[#172433] dark:text-[#82AEE6] dark:border-[#263852]",
    withdrawn:
      "bg-[#f5f5f5] text-[#111111] border-[#d4d4d4] font-medium dark:bg-[#251C33] dark:text-[#B898EC] dark:border-[#3C2C54]",
    repaid:
      "bg-[#f0fdf4] text-[#16803c] border-[#bbf7d0] dark:bg-[#19271C] dark:text-[#96CC9E] dark:border-[#2A4430]",
    success:
      "bg-[#f0fdf4] text-[#16803c] border-[#bbf7d0] dark:bg-[#19271C] dark:text-[#96CC9E] dark:border-[#2A4430]",
    warning:
      "bg-[#fefce8] text-[#a16207] border-[#fef08a] dark:bg-[#2A2315] dark:text-[#E0A34B] dark:border-[#443720]",
    defaulted:
      "bg-[#fef2f2] text-[#b42318] border-[#fecaca] dark:bg-[#2D1818] dark:text-[#EA8A8A] dark:border-[#4D2626]",
    error:
      "bg-[#fef2f2] text-[#b42318] border-[#fecaca] dark:bg-[#2D1818] dark:text-[#EA8A8A] dark:border-[#4D2626]",
    neutral:
      "bg-[#fafafa] text-[#666666] border-[#e5e5e5] dark:bg-[#1e1e1e] dark:text-[#a3a3a3] dark:border-[#2a2a2a]",
  };

  const dotColors: Record<BadgeVariant, string> = {
    requested: "bg-[#4b5563] dark:bg-[#E0A34B]",
    pending: "bg-[#4b5563] dark:bg-[#E0A34B]",
    funded: "bg-[#111111] dark:bg-[#82AEE6]",
    active: "bg-[#111111] dark:bg-[#82AEE6]",
    withdrawn: "bg-[#111111] dark:bg-[#B898EC]",
    repaid: "bg-[#16803c] dark:bg-[#96CC9E]",
    success: "bg-[#16803c] dark:bg-[#96CC9E]",
    warning: "bg-[#a16207] dark:bg-[#E0A34B]",
    defaulted: "bg-[#b42318] dark:bg-[#EA8A8A]",
    error: "bg-[#b42318] dark:bg-[#EA8A8A]",
    neutral: "bg-[#9ca3af] dark:bg-[#737373]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium",
    md: "px-2.5 py-1 text-xs font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]} shrink-0`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
