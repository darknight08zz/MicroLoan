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

/**
 * Returns today's date formatted as YYYY-MM-DD in the user's local timezone.
 * Used for setting the `min` attribute on HTML5 date inputs to prevent selecting past dates.
 */
export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a date string YYYY-MM-DD offset by `days` from today in local timezone.
 * Useful for quick date presets (+7 days, +14 days, +30 days).
 */
export function addDaysToToday(days: number): string {
  const target = new Date();
  target.setDate(target.getDate() + days);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converts a Unix timestamp (seconds) into a human-readable local date string.
 * Example: 1793212213 -> "28 Oct 2026"
 */
export function formatDueDate(timestampInSeconds: number): string {
  if (!timestampInSeconds || isNaN(timestampInSeconds) || timestampInSeconds <= 0) {
    return "Unknown";
  }

  const date = new Date(timestampInSeconds * 1000);
  if (isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Converts a Unix timestamp (seconds) into a human-readable local date and time string.
 * Example: "28 Oct 2026, 11:59 PM"
 */
export function formatDueDateTime(timestampInSeconds: number): string {
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
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Computes comprehensive due date details, remaining time, and badge presentation
 * based on the blockchain timestamp and optional loan status.
 *
 * Requirements:
 * - Loans that have not reached due date: show formatted due date + remaining time ("12 days remaining" or "2 days remaining")
 * - Loans whose due date is today: show "Due Today"
 * - Loans past their due date: show "Past Due" using warning/error status styling
 */
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
  const isTimePassed = now.getTime() > dueDate.getTime();

  let isPastDue = false;
  let isToday = false;
  let label = "";
  let badgeVariant: "defaulted" | "requested" | "neutral" = "neutral";
  let badgeClassName = "";

  if (options?.loanStatus === "Repaid") {
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
  } else if (isSameCalendarDay) {
    // Due date is today and has not yet expired
    isToday = true;
    label = "Due Today";
    badgeVariant = "requested";
    // Existing amber/warning styling from Badge variant "requested"
    badgeClassName =
      "inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a]";
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

/**
 * Formats a selected date string (from an HTML5 input `type="date"`) into a readable preview string.
 * Example input: "2026-10-15"
 * Example output:
 * {
 *   formattedLong: "Thursday, 15 Oct 2026",
 *   daysRemainingText: "9 days from today",
 *   isPast: false,
 *   isToday: false
 * }
 */
export function parseDateInputPreview(dateStr: string): {
  formattedLong: string;
  daysRemainingText: string;
  isPast: boolean;
  isToday: boolean;
} | null {
  if (!dateStr || !dateStr.trim()) {
    return null;
  }

  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    return null;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const selectedDate = new Date(year, month, day);
  if (isNaN(selectedDate.getTime())) {
    return null;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfSelected = selectedDate.getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.round((startOfSelected - startOfToday) / msPerDay);

  const formattedLong = selectedDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isPast = daysDiff < 0;
  const isToday = daysDiff === 0;

  let daysRemainingText = "";
  if (isPast) {
    const absDays = Math.abs(daysDiff);
    daysRemainingText = `${absDays} day${absDays === 1 ? "" : "s"} in the past`;
  } else if (isToday) {
    daysRemainingText = "Due Today (by 11:59 PM)";
  } else if (daysDiff === 1) {
    daysRemainingText = "1 day from today";
  } else {
    daysRemainingText = `${daysDiff} days from today`;
  }

  return {
    formattedLong,
    daysRemainingText,
    isPast,
    isToday,
  };
}
