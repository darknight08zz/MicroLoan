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
  connectedAccount,
  isAnyTxPending = false,
}: LoanDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!loan) return null;

  const contractAddress = getMicroLoanContractAddress();
  const normalizedAccount = connectedAccount ? connectedAccount.toLowerCase() : "";
  const isBorrower = normalizedAccount === loan.borrower.toLowerCase();

  const dueDateInfo = getDueDateInfo(loan.dueDateTimestamp);
  const repaymentInfo = getRepaymentDisplayInfo(loan);

  const copyToClipboard = (text: string, field: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
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
        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[#ffffff] border border-[#e5e5e5] rounded-[12px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
              Principal Amount
            </span>
            <div className="text-2xl font-bold tracking-tight text-[#111111]">
              {formatEth(loan.principal)}
            </div>
            <span className="text-[11px] text-[#666666] mt-1 block">
              Required escrow deposit
            </span>
          </div>

          <div className="p-4 bg-[#ffffff] border border-[#e5e5e5] rounded-[12px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
              Total Repayment Due
            </span>
            <div className="text-2xl font-bold tracking-tight text-[#111111]">
              {repaymentInfo.formatted}
            </div>
            <span className="text-[11px] text-[#666666] mt-1 block">
              Principal + lender fee
            </span>
          </div>
        </div>

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
            <span className="text-[#666666]">Due Date</span>
            <div className="flex items-center gap-2 text-[#111111] font-medium">
              <span>{dueDateInfo.formattedDate}</span>
              {loan.status !== "Repaid" && (
                <span className="text-[11px] text-[#666666]">
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

          {loan.status === "Requested" && onFund && (
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

          {loan.status === "Funded" && isBorrower && onWithdraw && (
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

          {loan.status === "Withdrawn" && isBorrower && onRepay && (
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
