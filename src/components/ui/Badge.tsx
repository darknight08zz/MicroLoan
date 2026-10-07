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
    requested: "bg-[#f5f5f5] text-[#4b5563] border-[#e5e5e5]",
    pending: "bg-[#f5f5f5] text-[#4b5563] border-[#e5e5e5]",
    funded: "bg-[#f5f5f5] text-[#111111] border-[#d4d4d4] font-medium",
    active: "bg-[#f5f5f5] text-[#111111] border-[#d4d4d4] font-medium",
    withdrawn: "bg-[#f5f5f5] text-[#111111] border-[#d4d4d4] font-medium",
    repaid: "bg-[#f0fdf4] text-[#16803c] border-[#bbf7d0]",
    success: "bg-[#f0fdf4] text-[#16803c] border-[#bbf7d0]",
    warning: "bg-[#fefce8] text-[#a16207] border-[#fef08a]",
    defaulted: "bg-[#fef2f2] text-[#b42318] border-[#fecaca]",
    error: "bg-[#fef2f2] text-[#b42318] border-[#fecaca]",
    neutral: "bg-[#fafafa] text-[#666666] border-[#e5e5e5]",
  };

  const dotColors: Record<BadgeVariant, string> = {
    requested: "bg-[#4b5563]",
    pending: "bg-[#4b5563]",
    funded: "bg-[#111111]",
    active: "bg-[#111111]",
    withdrawn: "bg-[#111111]",
    repaid: "bg-[#16803c]",
    success: "bg-[#16803c]",
    warning: "bg-[#a16207]",
    defaulted: "bg-[#b42318]",
    error: "bg-[#b42318]",
    neutral: "bg-[#9ca3af]",
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
