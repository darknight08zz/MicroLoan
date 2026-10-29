"use client";

import { useState } from "react";
import { Loan } from "@/types/loan";
import { Button } from "@/components/ui/Button";
import { formatEth, getDueDateInfo, getRepaymentDisplayInfo } from "@/utils";
import { SEPOLIA_EXPLORER_URL } from "@/contracts/config";

export interface LoanCardProps {
  loan: Loan;
  onFund?: (loan: Loan) => void;
  isFunding?: boolean;
  onWithdraw?: (loan: Loan) => void;
  isWithdrawing?: boolean;
  onRepay?: (loan: Loan) => void;
  isRepaying?: boolean;
  onViewDetails?: (loan: Loan) => void;
  connectedAccount?: string | null;
  isAnyTxPending?: boolean;
}

export function LoanCard({
  loan,
  onFund,
  isFunding = false,
  onWithdraw,
  isWithdrawing = false,
  onRepay,
  isRepaying = false,
  onViewDetails,
  connectedAccount,
  isAnyTxPending = false,
}: LoanCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const normalizedAccount = connectedAccount ? connectedAccount.toLowerCase() : "";
  const isBorrower = normalizedAccount === loan.borrower.toLowerCase();

  const dueDateInfo = getDueDateInfo(loan.dueDateTimestamp);
  const repaymentInfo = getRepaymentDisplayInfo(loan);

  // Address formatting
  const formatAddress = (addr: string) => {
    if (!addr || addr === "-" || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const copyBorrower = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator?.clipboard && loan.borrower) {
      navigator.clipboard.writeText(loan.borrower);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const copyShareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && navigator?.clipboard) {
      const url = `${window.location.origin}?loan=${loan.id}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    }
  };

  let feePercentage: string | null = null;
  let aprPercentage: number | null = null;
  try {
    const pNum = parseFloat(loan.principal.replace(/\s*ETH/gi, ""));
    const rNum = parseFloat(loan.repayment.replace(/\s*ETH/gi, ""));
    if (!isNaN(pNum) && !isNaN(rNum) && pNum > 0) {
      const diff = rNum - pNum;
      const pct = (diff / pNum) * 100;
      feePercentage = `${pct > 0 ? "+" : ""}${pct.toFixed(1).replace(/\.0$/, "")}%`;
      if (dueDateInfo.daysRemaining > 0) {
        aprPercentage = Number((pct * (365 / dueDateInfo.daysRemaining)).toFixed(1));
      }
    }
  } catch {
    feePercentage = null;
  }

  let progressPct = 0;
  let progressLabel = "0% funded";
  if (loan.status === "Requested") {
    progressPct = 0;
    progressLabel = "0% funded";
  } else if (loan.status === "Funded" || loan.status === "Withdrawn") {
    progressPct = 100;
    progressLabel = "100% funded";
  } else if (loan.status === "Repaid") {
    progressPct = 100;
    progressLabel = "100% repaid";
  } else if (loan.status === "Defaulted") {
    progressPct = 100;
    progressLabel = "Defaulted";
  } else if (loan.status === "Cancelled") {
    progressPct = 0;
    progressLabel = "Cancelled / Expired";
  }

  // Status Laser Tag styling
  const getLaserTagStyles = () => {
    switch (loan.status) {
      case "Repaid":
        return "bg-[#f4f4f5] dark:bg-[#282c37] text-[#18181b] dark:text-[#f4f4f5] border-[#e4e4e7] dark:border-white/[0.14]";
      case "Funded":
      case "Withdrawn":
        return "bg-[#f8fafc] dark:bg-[#282c37] text-[#334155] dark:text-[#e2e8f0] border-[#e2e8f0] dark:border-white/[0.14]";
      case "Requested":
        return "bg-[#f4f4f5] dark:bg-[#282c37] text-[#52525b] dark:text-[#d4d4d8] border-[#e4e4e7] dark:border-white/[0.14]";
      case "Defaulted":
        return "bg-[#fef2f2] dark:bg-[#2a2224] text-[#b91c1c] dark:text-[#fca5a5] border-[#fecaca] dark:border-[#4c1d24]";
      case "Cancelled":
        return "bg-[#f8fafc] dark:bg-[#1e293b] text-[#64748b] dark:text-[#94a3b8] border-[#cbd5e1] dark:border-[#334155]";
      default:
        return "bg-[#f4f4f5] dark:bg-[#282c37] text-[#52525b] dark:text-[#d4d4d8] border-[#e4e4e7] dark:border-white/[0.14]";
    }
  };

  const getStatusDotStyle = () => {
    switch (loan.status) {
      case "Repaid":
        return "bg-[#71717a] dark:bg-[#d4d4d8]";
      case "Funded":
      case "Withdrawn":
        return "bg-[#475569] dark:bg-[#94a3b8]";
      case "Requested":
        return "bg-[#a1a1aa] dark:bg-[#a1a1aa]";
      case "Defaulted":
        return "bg-[#ef4444]";
      case "Cancelled":
        return "bg-[#64748b] dark:bg-[#94a3b8]";
      default:
        return "bg-[#71717a]";
    }
  };

  const hasPrimaryAction =
    (loan.status === "Requested" && Boolean(onFund)) ||
    (loan.status === "Funded" && isBorrower && Boolean(onWithdraw)) ||
    (loan.status === "Withdrawn" && isBorrower && Boolean(onRepay));

  return (
    <div className="relative bg-[#ffffff] dark:bg-[#20232b] border border-[#e5e5e5] dark:border-white/[0.08] rounded-[22px] p-7 pt-9 md:p-8 md:pt-10 min-h-[430px] transition-all duration-300 hover:border-[#d4d4d4] dark:hover:border-white/[0.16] shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden group">
      {/* Top Edge Laser Accent Band */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#71717a]/30 dark:via-white/20 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
        <div
          className={`px-4 py-1.5 rounded-b-[8px] text-xs font-mono font-bold tracking-wider uppercase border-x border-b shadow-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${getLaserTagStyles()}`}
        >
          <span className={`w-2 h-2 rounded-full ${getStatusDotStyle()}`} />
          <span className="whitespace-nowrap">STATUS : {loan.status}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {/* Top Header: Loan ID with Countdown below it, Borrower Address on the right */}
        <div className="flex items-start justify-between gap-3 pt-1 pb-3">
          {/* Left Column: Loan ID on top, Due countdown badge right below it in a single line */}
          <div className="flex flex-col items-start gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-[#111111] dark:text-[#f4f4f5] whitespace-nowrap">
                #{loan.id}
              </span>
              <button
                type="button"
                onClick={copyShareLink}
                className="text-[#888888] hover:text-[#111111] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] transition-colors cursor-pointer text-xs p-1 rounded-[6px] hover:bg-[#f5f5f5] dark:hover:bg-white/[0.06]"
                title="Copy direct shareable link (?loan=ID)"
              >
                {copiedLink ? (
                  <span className="text-[10px] text-[#52525b] dark:text-[#d4d4d8] font-medium whitespace-nowrap">Copied!</span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )}
              </button>
            </div>

            {loan.status !== "Repaid" && loan.status !== "Defaulted" && loan.status !== "Cancelled" && (
              <div className="whitespace-nowrap">
                {dueDateInfo.isPastDue ? (
                  <span className="inline-block whitespace-nowrap text-xs px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold">
                    Past Due
                  </span>
                ) : dueDateInfo.isToday ? (
                  <span className="inline-block whitespace-nowrap text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                    Due Today
                  </span>
                ) : (
                  <span className="inline-block whitespace-nowrap text-xs font-semibold text-[#71717a] dark:text-[#a1a1aa]">
                    {dueDateInfo.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Borrower Address */}
          <div className="flex items-center gap-1.5 text-xs pt-0.5 whitespace-nowrap">
            <span className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] whitespace-nowrap">Borrower:</span>
            <span className="font-mono text-xs font-semibold text-[#111111] dark:text-[#f4f4f5] whitespace-nowrap">
              {formatAddress(loan.borrower)}
            </span>
            <button
              type="button"
              onClick={copyBorrower}
              className="text-[11px] text-[#71717a] hover:text-[#111111] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 font-medium shrink-0"
              title="Copy address"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={`${SEPOLIA_EXPLORER_URL}/address/${loan.borrower}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#71717a] hover:text-[#111111] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] p-0.5 shrink-0"
              title="View on Sepolia Explorer"
            >
              ↗
            </a>
          </div>
        </div>

        {/* Hero Financial Metric Pod (Larger & More Spacious) */}
        <div className="bg-[#f8f8f9] dark:bg-white/[0.03] border border-[#ebebeb] dark:border-white/[0.06] rounded-[16px] p-5 my-3.5">
          <div className="grid grid-cols-2 gap-5 w-full">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa] block mb-1.5">
                Requested
              </span>
              <div className="text-2xl md:text-[26px] font-bold tracking-tight text-[#111111] dark:text-[#ffffff]">
                {formatEth(loan.principal)}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa]">
                  Repayment
                </span>
                {feePercentage && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#e4e4e7] dark:bg-white/[0.08] text-[#18181b] dark:text-[#f4f4f5] border border-black/5 dark:border-white/10">
                      {feePercentage}
                    </span>
                    {aprPercentage !== null && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-[#f0fdf4] dark:bg-[#19271C] text-[#16803c] dark:text-[#96CC9E] border border-[#bbf7d0] dark:border-[#2A4430]">
                        {aprPercentage}% APR
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-2xl md:text-[26px] font-bold tracking-tight text-[#111111] dark:text-[#ffffff]">
                {repaymentInfo.formatted}
              </div>
            </div>
          </div>
        </div>

        {/* Terms Metadata & Progress */}
        <div className="pt-4 pb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5 text-xs text-[#71717a] dark:text-[#a1a1aa]">
              <span>Due date:</span>
              <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">{dueDateInfo.formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#71717a] dark:text-[#a1a1aa]">
              <span>Progress:</span>
              <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">{progressLabel}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-[#e4e4e7] dark:bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                loan.status === "Defaulted"
                  ? "bg-[#b42318] dark:bg-[#ef4444]"
                  : "bg-[#18181b] dark:bg-[#e4e4e7]"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons: Clean, Rock-Solid Height & Fluid Smooth Expansion */}
      <div className="pt-4 border-t border-[#ebebeb] dark:border-white/[0.06] flex items-center gap-3 justify-center">
        {loan.status === "Requested" && onFund && (
          <Button
            variant="primary"
            size="md"
            fullWidth
            isLoading={isFunding}
            disabled={isAnyTxPending || isBorrower}
            onClick={() => onFund(loan)}
            title={isBorrower ? "You cannot fund your own loan request" : "Fund this loan request"}
            className="h-11 rounded-full font-medium"
          >
            {isFunding ? "Funding..." : "Fund Loan"}
          </Button>
        )}

        {loan.status === "Funded" && isBorrower && onWithdraw && (
          <Button
            variant="primary"
            size="md"
            fullWidth
            isLoading={isWithdrawing}
            disabled={isAnyTxPending}
            onClick={() => onWithdraw(loan)}
            className="h-11 rounded-full font-medium"
          >
            {isWithdrawing ? "Withdrawing..." : "Withdraw Funds"}
          </Button>
        )}

        {loan.status === "Withdrawn" && isBorrower && onRepay && (
          <Button
            variant="primary"
            size="md"
            fullWidth
            isLoading={isRepaying}
            disabled={isAnyTxPending}
            onClick={() => onRepay(loan)}
            className="h-11 rounded-full font-medium"
          >
            {isRepaying ? "Repaying..." : "Repay Loan"}
          </Button>
        )}

        {onViewDetails && (
          <div className={`flex items-center justify-center ${hasPrimaryAction ? "shrink-0" : "w-full"}`}>
            <button
              type="button"
              onClick={() => onViewDetails(loan)}
              className={`group/btn relative cursor-pointer font-medium text-xs rounded-full h-11 flex items-center justify-center gap-2 border shadow-xs select-none active:scale-[0.98] transition-[width,max-width,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                hasPrimaryAction
                  ? "w-28 hover:w-36 px-4 bg-[#f4f4f5] dark:bg-white/[0.06] hover:bg-[#e4e4e7] dark:hover:bg-white/[0.14] text-[#18181b] dark:text-[#f4f4f5] border-black/5 dark:border-white/10"
                  : "w-36 hover:w-full px-5 bg-[#f4f4f5] dark:bg-white/[0.06] hover:bg-[#e4e4e7] dark:hover:bg-white/[0.14] text-[#18181b] dark:text-[#f4f4f5] border-black/5 dark:border-white/10"
              }`}
            >
              <span>Details</span>
              <svg
                className="w-3.5 h-3.5 opacity-60 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
