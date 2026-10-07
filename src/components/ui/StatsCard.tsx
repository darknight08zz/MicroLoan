import React from "react";
import { Card } from "./Card";

export interface StatsCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
}

export function StatsCard({
  label,
  value,
  subtext,
  icon,
  trend,
}: StatsCardProps) {
  return (
    <Card className="p-6 flex flex-col justify-between" hoverEffect>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-[8px] bg-[#fafafa] text-[#111111] border border-[#e5e5e5]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          {value}
        </div>
        <div className="mt-1 flex items-center gap-2">
          {trend && (
            <span
              className={`text-xs font-semibold inline-flex items-center gap-0.5 ${
                trend.positive ? "text-[#16803c]" : "text-[#b42318]"
              }`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {subtext && (
            <span className="text-xs text-[#666666]">{subtext}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
