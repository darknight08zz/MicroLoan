"use client";

import React, { useState } from "react";
import { Loan } from "@/types/loan";
import { Badge } from "@/components/ui/Badge";
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

  // Calculate fee percentage if available
  let feePercentage: string | null = null;
  try {
    const pNum = parseFloat(loan.principal.replace(/\s*ETH/gi, ""));
    const rNum = parseFloat(loan.repayment.replace(/\s*ETH/gi, ""));
    if (!isNaN(pNum) && !isNaN(rNum) && pNum > 0) {
      const diff = rNum - pNum;
      const pct = (diff / pNum) * 100;
      feePercentage = `${pct > 0 ? "+" : ""}${pct.toFixed(1).replace(/\.0$/, "")}%`;
    }
  } catch {
    feePercentage = null;
  }

  // Neutral progress bar logic
  // Requested: 0% funded
  // Funded / Withdrawn: 100% funded
  // Repaid: 100% repaid
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
  }

  // Status badge styling
  const getStatusBadge = () => {
    switch (loan.status) {
      case "Requested":
        return <Badge variant="requested" size="sm" dot>REQUESTED</Badge>;
      case "Funded":
        return <Badge variant="funded" size="sm" dot>FUNDED</Badge>;
      case "Withdrawn":
        return <Badge variant="withdrawn" size="sm" dot>WITHDRAWN</Badge>;
      case "Repaid":
        return <Badge variant="repaid" size="sm" dot>REPAID</Badge>;
      case "Defaulted":
        return <Badge variant="defaulted" size="sm" dot>DEFAULTED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{loan.status}</Badge>;
    }
  };

  return (
    <div className="bg-[#ffffff] border border-[#e5e5e5] rounded-[16px] p-6 transition-all duration-200 hover:border-[#d4d4d4] flex flex-col justify-between">
      <div>
        {/* Top Header: Status & Loan ID + Due Countdown */}
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <span className="font-mono text-xs font-semibold text-[#666666]">
              #{loan.id}
            </span>
          </div>

          {/* Due date countdown: Do NOT show countdown if Repaid */}
          {loan.status !== "Repaid" && (
            <div>
              {dueDateInfo.isPastDue ? (
                <Badge variant="defaulted" size="sm" dot>Past Due</Badge>
              ) : dueDateInfo.isToday ? (
                <Badge variant="warning" size="sm" dot>Due Today</Badge>
              ) : (
                <span className="text-[11px] font-medium text-[#666666]">
                  {dueDateInfo.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Borrower Address Row */}
        <div className="py-4 border-b border-[#e5e5e5]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
            Borrower
          </span>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-medium text-[#111111]">
              {formatAddress(loan.borrower)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyBorrower}
                className="text-[11px] text-[#666666] hover:text-[#111111] transition-colors cursor-pointer"
                title="Copy address"
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={`${SEPOLIA_EXPLORER_URL}/address/${loan.borrower}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#666666] hover:text-[#111111]"
                title="View on Sepolia Explorer"
              >
                ↗
              </a>
            </div>
          </div>
        </div>

        {/* Financial Numbers Grid */}
        <div className="py-4 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
              Requested
            </span>
            <div className="text-xl font-bold tracking-tight text-[#111111]">
              {formatEth(loan.principal)}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
              Repayment
            </span>
            <div className="text-xl font-bold tracking-tight text-[#111111]">
              {repaymentInfo.formatted}
            </div>
          </div>
        </div>

        {/* Terms Metadata: Fee % and Due Date */}
        <div className="py-3 border-t border-[#e5e5e5] grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[#666666] block text-[11px]">Repayment fee</span>
            <span className="font-medium text-[#111111]">
              {feePercentage || "-"}
            </span>
          </div>
          <div>
            <span className="text-[#666666] block text-[11px]">Due date</span>
            <span className="font-medium text-[#111111]">
              {dueDateInfo.formattedDate}
            </span>
          </div>
        </div>

        {/* Monochromatic Neutral Progress Indicator */}
        <div className="pt-3 pb-4">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium text-[#666666]">
            <span>Funding Progress</span>
            <span>{progressLabel}</span>
          </div>
          <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                loan.status === "Defaulted"
                  ? "bg-[#b42318]"
                  : loan.status === "Repaid"
                  ? "bg-[#16803c]"
                  : "bg-[#111111]"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons: Clean, High-Contrast */}
      <div className="pt-4 border-t border-[#e5e5e5] flex items-center gap-2.5">
        {loan.status === "Requested" && onFund && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            isLoading={isFunding}
            disabled={isAnyTxPending || isBorrower}
            onClick={() => onFund(loan)}
            title={isBorrower ? "You cannot fund your own loan request" : "Fund this loan request"}
          >
            {isFunding ? "Funding..." : "Fund Loan"}
          </Button>
        )}

        {loan.status === "Funded" && isBorrower && onWithdraw && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            isLoading={isWithdrawing}
            disabled={isAnyTxPending}
            onClick={() => onWithdraw(loan)}
          >
            {isWithdrawing ? "Withdrawing..." : "Withdraw Funds"}
          </Button>
        )}

        {loan.status === "Withdrawn" && isBorrower && onRepay && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            isLoading={isRepaying}
            disabled={isAnyTxPending}
            onClick={() => onRepay(loan)}
          >
            {isRepaying ? "Repaying..." : "Repay Loan"}
          </Button>
        )}

        {onViewDetails && (
          <Button
            variant={loan.status === "Requested" && onFund ? "secondary" : "primary"}
            size="sm"
            fullWidth={!(loan.status === "Requested" && onFund) && !(loan.status === "Funded" && isBorrower) && !(loan.status === "Withdrawn" && isBorrower)}
            onClick={() => onViewDetails(loan)}
          >
            Details
          </Button>
        )}
      </div>
    </div>
  );
}
