"use client";

import React, { useState, useMemo } from "react";
import { Loan } from "@/types/loan";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatEth, getDueDateInfo, getRepaymentDisplayInfo } from "@/utils";
import { TxLifecycleStatus } from "@/components/ui/TransactionBanner";

export interface BorrowerDashboardProps {
  loans: Loan[];
  isLoading: boolean;
  onWithdraw: (loan: Loan) => void;
  isWithdrawingLoan?: (loanId: number) => boolean;
  withdrawStatus?: TxLifecycleStatus;
  onRepay: (loan: Loan) => void;
  isRepayingLoan?: (loanId: number) => boolean;
  repayStatus?: TxLifecycleStatus;
  onCreateNewClick?: () => void;
  isAnyTxPending?: boolean;
  connectedAccount?: string | null;
  onConnectWallet?: () => void;
}

export function BorrowerDashboard({
  loans,
  isLoading,
  onWithdraw,
  isWithdrawingLoan,
  onRepay,
  isRepayingLoan,
  onCreateNewClick,
  isAnyTxPending = false,
  connectedAccount,
  onConnectWallet,
}: BorrowerDashboardProps) {
  const [filterTab, setFilterTab] = useState<"all" | "withdrawn" | "funded" | "requested" | "repaid">("all");

  // Strict case-insensitive filtering for the connected borrower's loans
  const userLoans = useMemo(() => {
    if (!connectedAccount) return [];
    const normalized = connectedAccount.toLowerCase();
    return loans.filter((l) => l.borrower.toLowerCase() === normalized);
  }, [loans, connectedAccount]);

  const filteredLoans = useMemo(() => {
    if (filterTab === "withdrawn") return userLoans.filter((l) => l.status === "Withdrawn");
    if (filterTab === "funded") return userLoans.filter((l) => l.status === "Funded");
    if (filterTab === "requested") return userLoans.filter((l) => l.status === "Requested");
    if (filterTab === "repaid") return userLoans.filter((l) => l.status === "Repaid");
    return userLoans;
  }, [userLoans, filterTab]);

  // Aggregate stats strictly scoped to the connected borrower
  const activeWithdrawnLoans = useMemo(() => userLoans.filter((l) => l.status === "Withdrawn"), [userLoans]);
  const fundedLoans = useMemo(() => userLoans.filter((l) => l.status === "Funded"), [userLoans]);
  const requestedLoans = useMemo(() => userLoans.filter((l) => l.status === "Requested"), [userLoans]);

  let totalDueEth = 0;
  for (const l of activeWithdrawnLoans) {
    const r = parseFloat(l.repayment.replace(/\s*ETH/gi, "")) || 0;
    totalDueEth += r;
  }

  // 1. Disconnected Wallet Empty State: Never show personal loan metrics or false 0-loans state
  if (!connectedAccount) {
    return (
      <div className="w-full">
        <div className="p-16 text-center bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <div className="w-12 h-12 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#111111] mx-auto mb-4 border border-[#e5e5e5]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div className="text-base font-bold text-[#111111] mb-1">
            Connect your wallet to view your loans.
          </div>
          <p className="text-xs text-[#666666] max-w-sm mx-auto mb-6">
            Please connect your MetaMask wallet to view your active micro-loans, track due dates, and manage repayments.
          </p>
          {onConnectWallet && (
            <Button variant="primary" size="md" onClick={onConnectWallet}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
            Active Repayments Due
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            {totalDueEth > 0 ? `${totalDueEth.toFixed(4).replace(/\.?0+$/, "")} ETH` : "0.00 ETH"}
          </div>
          <span className="text-xs text-[#666666] mt-1 block">
            Across {activeWithdrawnLoans.length} active withdrawn loan{activeWithdrawnLoans.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="p-6 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
            Ready to Withdraw
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            {fundedLoans.length} Loan{fundedLoans.length === 1 ? "" : "s"}
          </div>
          <span className="text-xs text-[#666666] mt-1 block">
            Funded by peer lenders on Sepolia
          </span>
        </div>

        <div className="p-6 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
            Open Requests
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            {requestedLoans.length} Pending
          </div>
          <span className="text-xs text-[#666666] mt-1 block">
            Waiting for marketplace funding
          </span>
        </div>
      </div>

      {/* Prominent Active Repayment Notice if Withdrawn loans exist */}
      {activeWithdrawnLoans.length > 0 && filterTab === "all" && (
        <div className="mb-8 p-6 bg-[#ffffff] border-2 border-[#111111] rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#e5e5e5]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#111111] block mb-1">
                Action Required • Active Capital Withdrawn
              </span>
              <h3 className="text-lg font-bold text-[#111111]">
                Repayment Scheduled
              </h3>
            </div>
            <div className="text-xs text-[#666666]">
              Ensure repayment is submitted before the designated due date to avoid contract default.
            </div>
          </div>

          <div className="space-y-4">
            {activeWithdrawnLoans.map((loan) => {
              const dueInfo = getDueDateInfo(loan.dueDateTimestamp);
              const repaymentInfo = getRepaymentDisplayInfo(loan);
              const isRepaying = isRepayingLoan ? isRepayingLoan(loan.id) : false;

              return (
                <div
                  key={loan.id}
                  className="p-5 bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-0.5">
                        Principal
                      </span>
                      <span className="font-medium text-sm text-[#111111]">
                        {formatEth(loan.principal)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase text-[#111111] block mb-0.5">
                        Repayment Amount
                      </span>
                      <span className="font-bold text-base text-[#111111]">
                        {repaymentInfo.formatted}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-0.5">
                        Due Date
                      </span>
                      <div className="text-xs">
                        <span className="font-medium text-[#111111] block">
                          {dueInfo.formattedDate}
                        </span>
                        {dueInfo.isPastDue ? (
                          <span className="font-semibold text-[#b42318] text-[11px]">
                            Past Due
                          </span>
                        ) : dueInfo.isToday ? (
                          <span className="font-semibold text-[#a16207] text-[11px]">
                            Due Today
                          </span>
                        ) : (
                          <span className="text-[#666666] text-[11px]">
                            {dueInfo.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-0.5">
                        Status
                      </span>
                      <Badge variant="withdrawn" size="sm" dot>
                        Withdrawn
                      </Badge>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant="primary"
                      size="md"
                      isLoading={isRepaying}
                      disabled={isAnyTxPending}
                      onClick={() => onRepay(loan)}
                    >
                      {isRepaying ? "Repaying..." : `Repay Loan (${repaymentInfo.formatted})`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "all", label: "All My Loans", count: userLoans.length },
            { id: "withdrawn", label: "Active (Withdrawn)", count: activeWithdrawnLoans.length },
            { id: "funded", label: "Ready to Withdraw", count: fundedLoans.length },
            { id: "requested", label: "Pending Funding", count: requestedLoans.length },
            { id: "repaid", label: "Settled / Repaid", count: userLoans.filter((l) => l.status === "Repaid").length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as "all" | "withdrawn" | "funded" | "requested" | "repaid")}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterTab === tab.id
                  ? "bg-[#111111] text-[#ffffff]"
                  : "bg-transparent text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterTab === tab.id ? "bg-[#333333] text-white" : "bg-[#f0f0f0] text-[#666666]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {onCreateNewClick && (
          <Button variant="secondary" size="sm" onClick={onCreateNewClick}>
            + Request Another Loan
          </Button>
        )}
      </div>

      {/* Loans List */}
      {isLoading && userLoans.length === 0 ? (
        <div className="p-16 text-center bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <div className="w-5 h-5 rounded-full border-2 border-[#e5e5e5] border-t-[#111111] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#666666]">Querying your loans from Sepolia...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="p-16 text-center bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <div className="text-base font-bold text-[#111111] mb-1">No Loans Found</div>
          <p className="text-xs text-[#666666] max-w-sm mx-auto mb-4">
            {filterTab === "all"
              ? "You haven't requested any micro-loans on Sepolia yet."
              : `No loans found in the '${filterTab}' category.`}
          </p>
          {onCreateNewClick && (
            <Button variant="primary" size="md" onClick={onCreateNewClick}>
              Create Loan Request
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => {
            const dueInfo = getDueDateInfo(loan.dueDateTimestamp);
            const repaymentInfo = getRepaymentDisplayInfo(loan);
            const isWithdrawing = isWithdrawingLoan ? isWithdrawingLoan(loan.id) : false;
            const isRepaying = isRepayingLoan ? isRepayingLoan(loan.id) : false;

            return (
              <div
                key={loan.id}
                className="p-6 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px] hover:border-[#d4d4d4] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1">
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-1">
                      Loan ID & Principal
                    </span>
                    <span className="font-mono text-xs text-[#666666] block">
                      #{loan.id}
                    </span>
                    <span className="font-bold text-lg text-[#111111] block mt-0.5">
                      {formatEth(loan.principal)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-1">
                      Repayment Amount
                    </span>
                    <span
                      className={`block text-lg ${
                        loan.status === "Withdrawn"
                          ? "font-bold text-[#111111]"
                          : "font-semibold text-[#333333]"
                      }`}
                    >
                      {repaymentInfo.formatted}
                    </span>
                    <span className="text-[11px] text-[#666666] block">
                      Agreed return
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-1">
                      Due Date
                    </span>
                    <span className="font-medium text-sm text-[#111111] block">
                      {dueInfo.formattedDate}
                    </span>
                    {/* No countdown if repaid */}
                    {loan.status !== "Repaid" && (
                      <span className="block mt-0.5">
                        {dueInfo.isPastDue ? (
                          <span className="font-semibold text-[#b42318] text-xs">
                            Past Due
                          </span>
                        ) : dueInfo.isToday ? (
                          <span className="font-semibold text-[#a16207] text-xs">
                            Due Today
                          </span>
                        ) : (
                          <span className="text-xs text-[#666666]">
                            {dueInfo.label}
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-1">
                      Loan Status
                    </span>
                    <div className="mt-0.5">
                      <Badge
                        variant={
                          loan.status === "Repaid"
                            ? "repaid"
                            : loan.status === "Defaulted"
                            ? "defaulted"
                            : loan.status === "Withdrawn"
                            ? "withdrawn"
                            : loan.status === "Funded"
                            ? "funded"
                            : "requested"
                        }
                        size="md"
                        dot
                      >
                        {loan.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contextual Actions */}
                <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-[#e5e5e5]">
                  {loan.status === "Funded" && (
                    <Button
                      variant="primary"
                      size="md"
                      isLoading={isWithdrawing}
                      disabled={isAnyTxPending}
                      onClick={() => onWithdraw(loan)}
                    >
                      {isWithdrawing ? "Withdrawing..." : "Withdraw Funds"}
                    </Button>
                  )}

                  {loan.status === "Withdrawn" && (
                    <Button
                      variant="primary"
                      size="md"
                      isLoading={isRepaying}
                      disabled={isAnyTxPending}
                      onClick={() => onRepay(loan)}
                    >
                      {isRepaying ? "Repaying..." : `Repay (${repaymentInfo.formatted})`}
                    </Button>
                  )}

                  {loan.status === "Requested" && (
                    <span className="text-xs text-[#666666] italic">
                      Listed on marketplace
                    </span>
                  )}

                  {loan.status === "Repaid" && (
                    <span className="text-xs font-medium text-[#16803c]">
                      ✓ Fully Settled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
