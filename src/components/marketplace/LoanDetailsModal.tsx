"use client";

import React, { useState } from "react";
import { Loan } from "@/types/loan";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatEth, getDueDateInfo, getRepaymentDisplayInfo } from "@/utils";
import { SEPOLIA_EXPLORER_URL, getMicroLoanContractAddress } from "@/contracts/config";

export interface LoanDetailsModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
  onFund?: (loan: Loan) => void;
  isFunding?: boolean;
  onWithdraw?: (loan: Loan) => void;
  isWithdrawing?: boolean;
  onRepay?: (loan: Loan) => void;
  isRepaying?: boolean;
  onMarkDefault?: (loan: Loan) => void;
  isMarkingDefault?: boolean;
  connectedAccount?: string | null;
  isAnyTxPending?: boolean;
}

export function LoanDetailsModal({
  loan,
  isOpen,
  onClose,
  onFund,
  isFunding = false,
  onWithdraw,
  isWithdrawing = false,
  onRepay,
  isRepaying = false,
  onMarkDefault,
  isMarkingDefault = false,
  connectedAccount,
  isAnyTxPending = false,
}: LoanDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!loan) return null;

  const contractAddress = getMicroLoanContractAddress();
  const normalizedAccount = connectedAccount ? connectedAccount.toLowerCase() : "";
  const isBorrower = normalizedAccount === loan.borrower.toLowerCase();

  const dueDateInfo = getDueDateInfo(loan.dueDateTimestamp, { loanStatus: loan.status });
  const repaymentInfo = getRepaymentDisplayInfo(loan);

  // 3-part Fee Calculation
  const feeRaw = loan.repaymentRaw > loan.principalRaw ? loan.repaymentRaw - loan.principalRaw : BigInt(0);
  const feeEth = formatEth(feeRaw);
  const feePct = loan.principalRaw > BigInt(0)
    ? ((Number((feeRaw * BigInt(10000)) / loan.principalRaw)) / 100).toFixed(1).replace(/\.0$/, "")
    : "0";

  const durationDays = dueDateInfo.daysRemaining > 0 ? dueDateInfo.daysRemaining : 0;
  const aprValue = durationDays > 0 && parseFloat(feePct) > 0
    ? Number((parseFloat(feePct) * (365 / durationDays)).toFixed(1))
    : null;

  // Default / Expired eligibility
  const canMarkDefault =
    dueDateInfo.isPastDue &&
    loan.status !== "Repaid" &&
    loan.status !== "Defaulted" &&
    loan.status !== "Cancelled";

  const copyToClipboard = (text: string, field: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      const url = `${window.location.origin}?loan=${loan.id}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const stages = [
    { label: "Requested", done: true },
    { label: "Funded", done: loan.status !== "Requested" },
    { label: "Withdrawn", done: loan.status === "Withdrawn" || loan.status === "Repaid" || loan.status === "Defaulted" },
    { label: "Repaid", done: loan.status === "Repaid" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Loan Details #${loan.id}`}
      description="Cryptographic on-chain verification from Ethereum Sepolia smart contract."
      maxWidth="lg"
    >
      <div className="space-y-6 text-sm">
        {/* Header Bar with Shareable Link */}
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#666666]">
              Shareable Direct Link
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#111111] bg-[#fafafa] hover:bg-[#f0f0f0] border border-[#e5e5e5] rounded-[8px] transition-colors cursor-pointer"
            title="Copy shareable direct link (?loan=ID)"
          >
            <svg
              className="w-3.5 h-3.5 text-[#666666]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>{copiedLink ? "Link Copied!" : "Copy Loan URL"}</span>
          </button>
        </div>

        {/* Status & Lifecycle Timeline */}
        <div className="p-4 bg-[#fafafa] border border-[#e5e5e5] rounded-[12px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
              Current Lifecycle
            </span>
            <Badge
              variant={
                loan.status === "Repaid"
                  ? "repaid"
                  : loan.status === "Defaulted"
                  ? "defaulted"
                  : loan.status === "Cancelled"
                  ? "cancelled"
                  : "active"
              }
              size="sm"
              dot
            >
              {loan.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {stages.map((st, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mb-1 border ${
                    st.done
                      ? "bg-[#111111] text-[#ffffff] border-[#111111]"
                      : "bg-[#ffffff] text-[#888888] border-[#e5e5e5]"
                  }`}
                >
                  {st.done ? "✓" : idx + 1}
                </div>
                <span
                  className={`text-[11px] ${
                    st.done ? "font-semibold text-[#111111]" : "text-[#888888]"
                  }`}
                >
                  {st.label}
                </span>
              </div>
            ))}
          </div>

          {loan.status === "Cancelled" && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-[8px] text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Cancelled / Expired: </span>
              This loan request closed without funds being disbursed to the borrower. The borrower never received the loan Ether, so no default occurred.
            </div>
          )}

          {loan.status === "Defaulted" && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-700">
              <span className="font-semibold text-rose-900">Defaulted: </span>
              The borrower withdrew the loan principal but failed to repay by the designated due date.
            </div>
          )}
        </div>

        {/* Explicit 3-part Fee Breakdown */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#666666] block mb-2">
            Financial Structure (3-Part Breakdown)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-[#ffffff] border border-[#e5e5e5] rounded-[12px]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
                1. Principal
              </span>
              <div className="text-lg font-bold tracking-tight text-[#111111]">
                {formatEth(loan.principal)}
              </div>
              <span className="text-[11px] text-[#666666] mt-0.5 block">
                Escrow deposit
              </span>
            </div>

            <div className="p-3.5 bg-[#ffffff] border border-[#e5e5e5] rounded-[12px]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
                2. Lender Fee
              </span>
              <div className="text-lg font-bold tracking-tight text-[#16803c]">
                +{feeEth}
              </div>
              <span className="text-[11px] text-[#666666] mt-0.5 block">
                {feePct}% fixed return
              </span>
            </div>

            <div className="p-3.5 bg-[#fafafa] border border-[#d9d9d9] rounded-[12px]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
                3. Total Repayment
              </span>
              <div className="text-lg font-bold tracking-tight text-[#111111]">
                {repaymentInfo.formatted}
              </div>
              <span className="text-[11px] text-[#666666] mt-0.5 block">
                Principal + fee
              </span>
            </div>
          </div>
        </div>

        {/* Expired / Past Due Callout Banner */}
        {canMarkDefault && (
          <div className="p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-[12px] text-xs text-[#991b1b] flex items-start gap-2.5">
            <span className="font-bold text-sm leading-none mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-xs text-[#991b1b]">
                Repayment Term Expired (Past Due)
              </p>
              <p className="text-[11px] text-[#b91c1c] mt-0.5">
                {loan.status === "Funded"
                  ? "The borrower failed to withdraw the funds before the due date. The lender can trigger an on-chain refund to recover 100% of the principal."
                  : "The loan deadline elapsed without full repayment. Anyone can trigger on-chain default registration to update the immutable ledger."}
              </p>
            </div>
          </div>
        )}

        {/* Addresses & Due Date Details */}
        <div className="border border-[#e5e5e5] rounded-[12px] divide-y divide-[#e5e5e5] bg-[#ffffff]">
          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-[#666666]">Borrower</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#111111]">{loan.borrower}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(loan.borrower, "borrower")}
                className="text-[11px] text-[#666666] hover:text-[#111111] cursor-pointer"
              >
                {copiedField === "borrower" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-[#666666]">Lender</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#111111]">
                {loan.lender && loan.lender !== "0x0000000000000000000000000000000000000000"
                  ? loan.lender
                  : "Unassigned (Open for funding)"}
              </span>
              {loan.lender && loan.lender !== "0x0000000000000000000000000000000000000000" && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(loan.lender, "lender")}
                  className="text-[11px] text-[#666666] hover:text-[#111111] cursor-pointer"
                >
                  {copiedField === "lender" ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-[#666666]">Offered Return / Interest</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#16803c]">
                +{feePct}% ({feeEth})
              </span>
              {aprValue !== null && (
                <span className="text-[10px] text-[#666666] font-medium bg-[#f5f5f5] px-1.5 py-0.2 rounded border border-[#e5e5e5]">
                  {aprValue}% APR
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-[#666666]">Due Date</span>
            <div className="flex items-center gap-2 text-[#111111] font-medium">
              <span>{dueDateInfo.formattedDate}</span>
              {loan.status !== "Repaid" && loan.status !== "Defaulted" && loan.status !== "Cancelled" && (
                <span className={`text-[11px] ${dueDateInfo.isPastDue ? "text-[#b42318] font-bold" : "text-[#666666]"}`}>
                  ({dueDateInfo.label})
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <span className="text-[#666666]">Smart Contract</span>
            <a
              href={`${SEPOLIA_EXPLORER_URL}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[#111111] hover:underline flex items-center gap-1"
            >
              <span>{contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>

          {/* Mark Default / Lender Refund Action */}
          {canMarkDefault && onMarkDefault && (
            <Button
              variant="danger"
              size="md"
              isLoading={isMarkingDefault}
              disabled={isAnyTxPending}
              onClick={() => {
                onMarkDefault(loan);
                onClose();
              }}
            >
              {isMarkingDefault
                ? "Processing On-Chain..."
                : loan.status === "Funded"
                ? `Claim Principal Refund (${formatEth(loan.principal)})`
                : loan.status === "Requested"
                ? "Mark Expired / Cancel Request"
                : "Record Default On-Chain"}
            </Button>
          )}

          {loan.status === "Requested" && onFund && !canMarkDefault && (
            <Button
              variant="primary"
              size="md"
              isLoading={isFunding}
              disabled={isAnyTxPending || isBorrower}
              onClick={() => {
                onFund(loan);
                onClose();
              }}
            >
              {isFunding ? "Funding..." : `Fund Loan (${formatEth(loan.principal)})`}
            </Button>
          )}

          {loan.status === "Funded" && isBorrower && onWithdraw && !canMarkDefault && (
            <Button
              variant="primary"
              size="md"
              isLoading={isWithdrawing}
              disabled={isAnyTxPending}
              onClick={() => {
                onWithdraw(loan);
                onClose();
              }}
            >
              {isWithdrawing ? "Withdrawing..." : "Withdraw Funds"}
            </Button>
          )}

          {loan.status === "Withdrawn" && isBorrower && onRepay && !canMarkDefault && (
            <Button
              variant="primary"
              size="md"
              isLoading={isRepaying}
              disabled={isAnyTxPending}
              onClick={() => {
                onRepay(loan);
                onClose();
              }}
            >
              {isRepaying ? "Repaying..." : `Repay Loan (${repaymentInfo.formatted})`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

