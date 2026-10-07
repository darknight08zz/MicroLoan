/**
 * Formatting Utilities for MicroLoan DApp.
 * Provides consistent formatting for ETH currency amounts, handles edge cases gracefully,
 * and standardizes repayment display information across borrower and lender views.
 */

import { formatEther } from "ethers";
import type { Loan } from "@/types/loan";

export interface RepaymentDisplayInfo {
  /** Clean formatted repayment string with ETH suffix, e.g. "0.105 ETH" */
  formatted: string;
  /** Subtitle / helper note clarifying repayment state */
  subtext?: string;
  /** Whether this amount should receive prominent visual treatment */
  isProminent: boolean;
  /** Optional badge label (e.g. "Due", "Settled") */
  badgeLabel?: string;
  /** Visual badge color style */
  badgeColorClass?: string;
}

/**
 * Standardizes ETH value formatting across the application.
 * - Handles raw BigInt wei, formatted strings (e.g. "0.1 ETH"), numbers, and null/undefined.
 * - Trims excessive or messy decimal places for clean UI presentation (max 6 decimals).
 * - Leaves actual underlying BigInt values untouched for transactions.
 * - Handles missing or invalid values gracefully.
 *
 * @param value Raw wei BigInt, ETH string, or number
 * @param options includeUnit (default: true), maxDecimals (default: 6)
 */
export function formatEth(
  value: string | bigint | number | null | undefined,
  options?: {
    includeUnit?: boolean;
    maxDecimals?: number;
  }
): string {
  if (value === null || value === undefined) {
    return "-";
  }

  let str = "";
  if (typeof value === "bigint") {
    try {
      str = formatEther(value);
    } catch {
      return "-";
    }
  } else if (typeof value === "number") {
    str = String(value);
  } else {
    // Strip existing " ETH" suffix if present
    str = value.replace(/\s*ETH\s*/gi, "").trim();
  }

  if (!str || str === "-" || isNaN(Number(str))) {
    return "-";
  }

  // Parse decimal parts
  const parts = str.split(".");
  let formatted = parts[0];

  if (parts[1]) {
    const maxDec = options?.maxDecimals ?? 6;
    let decimals = parts[1].slice(0, maxDec);
    // Trim trailing zeros
    decimals = decimals.replace(/0+$/, "");
    if (decimals.length > 0) {
      formatted += "." + decimals;
    }
  }

  if (options?.includeUnit === false) {
    return formatted;
  }

  return `${formatted} ETH`;
}

/**
 * Computes status-specific repayment information and visual prominence for borrower & lender tables.
 *
 * Requirements:
 * - Withdrawn: Active loan where repayment is owed. Prominent display for borrower.
 * - Funded: Principal funded, scheduled repayment amount displayed.
 * - Repaid: Final repayment settled.
 * - Defaulted: Repayment unpaid / defaulted.
 * - Requested: Proposed repayment terms.
 */
export function getRepaymentDisplayInfo(
  loan: Loan,
  context: "borrower" | "lender" = "borrower"
): RepaymentDisplayInfo {
  const formatted = formatEth(loan.repayment);

  switch (loan.status) {
    case "Withdrawn":
      // Active Withdrawn loan: Repayment is actively due from borrower to lender
      if (context === "borrower") {
        return {
          formatted,
          subtext: "Amount to repay",
          isProminent: true,
          badgeLabel: "Due",
          badgeColorClass: "bg-blue-100 text-blue-800 border-blue-200",
        };
      }
      return {
        formatted,
        subtext: "Expected payout",
        isProminent: true,
        badgeLabel: "Awaiting Repay",
        badgeColorClass: "bg-amber-100 text-amber-800 border-amber-200",
      };

    case "Funded":
      // Funded: Principal awaiting withdrawal by borrower
      if (context === "borrower") {
        return {
          formatted,
          subtext: "Repayment on withdraw",
          isProminent: false,
        };
      }
      return {
        formatted,
        subtext: "Expected on due date",
        isProminent: false,
      };

    case "Repaid":
      // Repaid: Successfully settled on-chain
      return {
        formatted,
        subtext: context === "borrower" ? "Settled in full" : "Received in full",
        isProminent: false,
        badgeLabel: "Settled",
        badgeColorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };

    case "Defaulted":
      // Defaulted: Deadline passed without full repayment
      return {
        formatted,
        subtext: "Unpaid / Defaulted",
        isProminent: false,
        badgeLabel: "Overdue",
        badgeColorClass: "bg-rose-50 text-rose-700 border-rose-200",
      };

    case "Requested":
    default:
      // Requested: Open request
      return {
        formatted,
        subtext: context === "lender" ? "Proposed return" : "Agreed repayment",
        isProminent: false,
      };
  }
}
