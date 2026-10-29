/**
 * Date and Timestamp Utility for MicroLoan DApp.
 * Handles conversion of on-chain Unix timestamps into human-readable local dates and times,
 * calculates remaining days, and formats due date lifecycle badges.
 */

import type { LoanStatus } from "../types/loan";

export interface DueDateInfo {
  /** Formatted date string (e.g. "28 Oct 2026") */
  formattedDate: string;
  /** Formatted local date and time string (e.g. "28 Oct 2026, 11:59 PM") */
  formattedDateTime: string;
  /** ISO 8601 string representation */
  isoString: string;
  /** Original Unix timestamp in seconds */
  timestamp: number;
  /** Whether the due date is strictly in the past */
  isPastDue: boolean;
  /** Whether the due date is today */
  isToday: boolean;
  /** Number of calendar days remaining (0 if today, negative if past) */
  daysRemaining: number;
  /**
   * Human-readable label:
   * - "Past Due" for overdue loans
   * - "Due Today" for loans due today
   * - "1 day remaining" or "X days remaining" for future loans
   */
  label: string;
  /** Badge color styling variant */
  badgeVariant: "defaulted" | "requested" | "neutral";
  /** Tailwind CSS classes matching existing MicroLoan design system */
  badgeClassName: string;
}

export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalNowDateTimeString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export function addTimeToNow(options: {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}): string {
  const now = new Date();
  const totalMs =
    ((options.days ?? 0) * 86400 +
      (options.hours ?? 0) * 3600 +
      (options.minutes ?? 0) * 60 +
      (options.seconds ?? 0)) *
    1000;
  const target = new Date(now.getTime() + totalMs);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  const hours = String(target.getHours()).padStart(2, "0");
  const minutes = String(target.getMinutes()).padStart(2, "0");
  const seconds = String(target.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export function addDaysToToday(days: number): string {
  return addTimeToNow({ days });
}


export function formatDueDate(timestampInSeconds: number): string {
  if (!timestampInSeconds || isNaN(timestampInSeconds) || timestampInSeconds <= 0) {
    return "Unknown";
  }

  const date = new Date(timestampInSeconds * 1000);
  if (isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatDueDateTime(timestampInSeconds: number): string {
  return formatDueDate(timestampInSeconds);
}


export function getDueDateInfo(
  dueDateTimestampInSeconds: number,
  options?: {
    loanStatus?: LoanStatus;
    referenceDate?: Date;
  }
): DueDateInfo {
  const timestamp = Number(dueDateTimestampInSeconds);
  const now = options?.referenceDate ?? new Date();

  if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
    return {
      formattedDate: "Unknown",
      formattedDateTime: "Unknown",
      isoString: "",
      timestamp: 0,
      isPastDue: false,
      isToday: false,
      daysRemaining: 0,
      label: "No Due Date",
      badgeVariant: "neutral",
      badgeClassName:
        "inline-flex items-center text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80",
    };
  }

  const dueDate = new Date(timestamp * 1000);
  const isValidDate = !isNaN(dueDate.getTime());

  if (!isValidDate) {
    return {
      formattedDate: "Invalid Date",
      formattedDateTime: "Invalid Date",
      isoString: "",
      timestamp,
      isPastDue: false,
      isToday: false,
      daysRemaining: 0,
      label: "Invalid Date",
      badgeVariant: "neutral",
      badgeClassName:
        "inline-flex items-center text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80",
    };
  }

  const formattedDate = dueDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedDateTime = dueDate.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const isoString = dueDate.toISOString();

  // Calendar day calculation using user's local timezone
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.round((startOfDueDate - startOfToday) / msPerDay);
  const isSameCalendarDay = daysDiff === 0;

  // Determine if timestamp has strictly passed
  const diffSec = Math.floor((dueDate.getTime() - now.getTime()) / 1000);
  const isTimePassed = diffSec <= 0;

  let isPastDue = false;
  let isToday = false;
  let label = "";
  let badgeVariant: "defaulted" | "requested" | "neutral" = "neutral";
  let badgeClassName = "";

  if (options?.loanStatus === "Repaid" || options?.loanStatus === "Defaulted" || options?.loanStatus === "Cancelled") {
    label = "";
    badgeClassName = "";
  } else if (isTimePassed) {
    // Due date has strictly passed
    isPastDue = true;
    label = "Past Due";
    badgeVariant = "defaulted";
    // Existing warning/error status styling from Badge variant "defaulted"
    badgeClassName =
      "inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]";
  } else if (diffSec < 60) {
    isToday = true;
    label = `${diffSec}s remaining`;
    badgeVariant = "requested";
    badgeClassName =
      "inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a]";
  } else if (diffSec < 3600) {
    isToday = true;
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    label = `${m}m ${s}s remaining`;
    badgeVariant = "requested";
    badgeClassName =
      "inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a]";
  } else if (diffSec < 86400) {
    isToday = isSameCalendarDay;
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    label = `${h}h ${m}m remaining`;
    badgeVariant = isSameCalendarDay ? "requested" : "neutral";
    badgeClassName = isSameCalendarDay
      ? "inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a]"
      : "inline-flex items-center text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80";
  } else if (daysDiff === 1) {
    // Tomorrow
    label = "1 day remaining";
    badgeVariant = "neutral";
    badgeClassName =
      "inline-flex items-center text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80";
  } else {
    // Multiple days in the future
    label = `${daysDiff} days remaining`;
    badgeVariant = "neutral";
    badgeClassName =
      "inline-flex items-center text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80";
  }

  return {
    formattedDate,
    formattedDateTime,
    isoString,
    timestamp,
    isPastDue,
    isToday,
    daysRemaining: daysDiff,
    label,
    badgeVariant,
    badgeClassName,
  };
}


export function parseDateInputPreview(dateStr: string): {
  formattedLong: string;
  daysRemainingText: string;
  daysRemaining: number;
  isPast: boolean;
  isToday: boolean;
} | null {
  if (!dateStr || !dateStr.trim()) {
    return null;
  }

  let selectedDate = new Date(dateStr);
  if (isNaN(selectedDate.getTime()) && dateStr.includes("-")) {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      selectedDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 45, 0);
    }
  }

  if (isNaN(selectedDate.getTime())) {
    return null;
  }

  const now = new Date();
  const diffSec = Math.floor((selectedDate.getTime() - now.getTime()) / 1000);
  const isPast = diffSec <= 0;
  const isToday = selectedDate.toDateString() === now.toDateString();

  const formattedLong = selectedDate.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  let daysRemainingText = "";
  if (isPast) {
    daysRemainingText = "Date/time is in the past";
  } else if (diffSec < 60) {
    daysRemainingText = `${diffSec} seconds from now`;
  } else if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    daysRemainingText = `${m}m ${s}s from now`;
  } else if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    daysRemainingText = `${h}h ${m}m from now`;
  } else {
    const days = Math.round(diffSec / 86400);
    daysRemainingText = `${days} day${days === 1 ? "" : "s"} from now`;
  }

  return {
    formattedLong,
    daysRemainingText,
    daysRemaining: Math.max(0, Math.round(diffSec / 86400)),
    isPast,
    isToday,
  };
}
