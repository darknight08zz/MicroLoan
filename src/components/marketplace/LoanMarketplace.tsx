"use client";

import React, { useState, useMemo } from "react";
import { Loan } from "@/types/loan";
import { LoanCard } from "./LoanCard";
import { LoanDetailsModal } from "./LoanDetailsModal";
import { TxLifecycleStatus } from "@/components/ui/TransactionBanner";

export interface LoanMarketplaceProps {
  loans: Loan[];
  isLoading: boolean;
  onFund?: (loan: Loan) => void;
  isFundingLoan?: (loanId: number) => boolean;
  fundStatus?: TxLifecycleStatus;
  onWithdraw?: (loan: Loan) => void;
  isWithdrawingLoan?: (loanId: number) => boolean;
  withdrawStatus?: TxLifecycleStatus;
  onRepay?: (loan: Loan) => void;
  isRepayingLoan?: (loanId: number) => boolean;
  repayStatus?: TxLifecycleStatus;
  onMarkDefault?: (loan: Loan) => void;
  isMarkingDefaultLoan?: (loanId: number) => boolean;
  connectedAccount?: string | null;
  isAnyTxPending?: boolean;
  initialFilter?: string;
  initialSelectedLoanId?: number | null;
  onRequestLoanClick?: () => void;
}

export function LoanMarketplace({
  loans,
  isLoading,
  onFund,
  isFundingLoan,
  onWithdraw,
  isWithdrawingLoan,
  onRepay,
  isRepayingLoan,
  onMarkDefault,
  isMarkingDefaultLoan,
  connectedAccount,
  isAnyTxPending = false,
  initialFilter = "all",
  initialSelectedLoanId,
  onRequestLoanClick,
}: LoanMarketplaceProps) {
  const [filterTab, setFilterTab] = useState<string>(initialFilter);
  const [prevInitialFilter, setPrevInitialFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "dueDate" | "amountHigh" | "amountLow" | "rateHigh" | "rateLow">("newest");
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(() => initialSelectedLoanId ?? null);

  if (initialFilter !== prevInitialFilter) {
    setPrevInitialFilter(initialFilter);
    setFilterTab(initialFilter);
  }

  const selectedLoan = useMemo(() => {
    if (selectedLoanId === null) return null;
    return loans.find((l) => l.id === selectedLoanId) ?? null;
  }, [selectedLoanId, loans]);

  const filteredLoans = useMemo(() => {
    let result = [...loans];

    if (filterTab === "requested") {
      result = result.filter((l) => l.status === "Requested");
    } else if (filterTab === "funded") {
      result = result.filter((l) => l.status === "Funded");
    } else if (filterTab === "withdrawn") {
      result = result.filter((l) => l.status === "Withdrawn");
    } else if (filterTab === "repaid") {
      result = result.filter((l) => l.status === "Repaid");
    } else if (filterTab === "defaulted") {
      result = result.filter((l) => l.status === "Defaulted");
    } else if (filterTab === "cancelled") {
      result = result.filter((l) => l.status === "Cancelled");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          String(l.id).includes(q) ||
          l.borrower.toLowerCase().includes(q) ||
          l.lender.toLowerCase().includes(q)
      );
    }

    const getRate = (l: Loan) => {
      const p = parseFloat(l.principal.replace(/\s*ETH/gi, "")) || 0;
      const r = parseFloat(l.repayment.replace(/\s*ETH/gi, "")) || p;
      return p > 0 ? ((r - p) / p) * 100 : 0;
    };

    result.sort((a, b) => {
      if (sortBy === "rateHigh") {
        return getRate(b) - getRate(a);
      }
      if (sortBy === "rateLow") {
        return getRate(a) - getRate(b);
      }
      if (sortBy === "newest") {
        return b.id - a.id;
      }
      if (sortBy === "dueDate") {
        return a.dueDateTimestamp - b.dueDateTimestamp;
      }
      if (sortBy === "amountHigh") {
        const pA = parseFloat(a.principal.replace(/\s*ETH/gi, "")) || 0;
        const pB = parseFloat(b.principal.replace(/\s*ETH/gi, "")) || 0;
        return pB - pA;
      }
      if (sortBy === "amountLow") {
        const pA = parseFloat(a.principal.replace(/\s*ETH/gi, "")) || 0;
        const pB = parseFloat(b.principal.replace(/\s*ETH/gi, "")) || 0;
        return pA - pB;
      }
      return 0;
    });

    return result;
  }, [loans, filterTab, searchQuery, sortBy]);

  const requestedCount = useMemo(() => loans.filter((l) => l.status === "Requested").length, [loans]);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All Loans", count: loans.length },
            { id: "requested", label: "Open Requests", count: requestedCount },
            { id: "funded", label: "Funded", count: loans.filter((l) => l.status === "Funded").length },
            { id: "withdrawn", label: "Withdrawn", count: loans.filter((l) => l.status === "Withdrawn").length },
            { id: "repaid", label: "Settled", count: loans.filter((l) => l.status === "Repaid").length },
            { id: "defaulted", label: "Defaulted", count: loans.filter((l) => l.status === "Defaulted").length },
            { id: "cancelled", label: "Cancelled", count: loans.filter((l) => l.status === "Cancelled").length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
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

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search ID or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-1.5 pl-3 pr-8 text-xs bg-[#ffffff] border border-[#e5e5e5] rounded-[8px] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#111111] w-48 sm:w-56"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999999] hover:text-[#111111] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "dueDate" | "amountHigh" | "amountLow" | "rateHigh" | "rateLow")}
            className="py-1.5 px-3 text-xs bg-[#ffffff] border border-[#e5e5e5] rounded-[8px] text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="rateHigh">Highest Yield (% Return)</option>
            <option value="rateLow">Lowest Yield (% Return)</option>
            <option value="dueDate">Due Date (Earliest)</option>
            <option value="amountHigh">Principal (High to Low)</option>
            <option value="amountLow">Principal (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Grid of Loan Cards */}
      {isLoading && loans.length === 0 ? (
        <div className="p-16 text-center bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <div className="w-5 h-5 rounded-full border-2 border-[#e5e5e5] border-t-[#111111] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#666666]">Querying loans from Sepolia smart contract...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="p-16 text-center bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <div className="text-base font-bold text-[#111111] mb-1">No Loans Found</div>
          <p className="text-xs text-[#666666] max-w-sm mx-auto mb-4">
            {searchQuery
              ? "No loan matches your search query. Try clearing the filter or search term."
              : filterTab === "requested"
              ? "There are currently no open loan requests available for funding."
              : "No loans match the selected filter."}
          </p>
          {onRequestLoanClick && (
            <button
              type="button"
              onClick={onRequestLoanClick}
              className="px-4 py-2 bg-[#111111] text-[#ffffff] rounded-[8px] text-xs font-medium hover:bg-[#2a2a2a] cursor-pointer"
            >
              Create Loan Request
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8">
          {filteredLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onFund={onFund}
              isFunding={isFundingLoan ? isFundingLoan(loan.id) : false}
              onWithdraw={onWithdraw}
              isWithdrawing={isWithdrawingLoan ? isWithdrawingLoan(loan.id) : false}
              onRepay={onRepay}
              isRepaying={isRepayingLoan ? isRepayingLoan(loan.id) : false}
              onViewDetails={(l) => setSelectedLoanId(l.id)}
              connectedAccount={connectedAccount}
              isAnyTxPending={isAnyTxPending}
            />
          ))}
        </div>
      )}

      {/* Loan Details Popover Modal */}
      <LoanDetailsModal
        loan={selectedLoan}
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoanId(null)}
        onFund={onFund}
        isFunding={selectedLoan && isFundingLoan ? isFundingLoan(selectedLoan.id) : false}
        onWithdraw={onWithdraw}
        isWithdrawing={selectedLoan && isWithdrawingLoan ? isWithdrawingLoan(selectedLoan.id) : false}
        onRepay={onRepay}
        isRepaying={selectedLoan && isRepayingLoan ? isRepayingLoan(selectedLoan.id) : false}
        onMarkDefault={onMarkDefault}
        isMarkingDefault={selectedLoan && isMarkingDefaultLoan ? isMarkingDefaultLoan(selectedLoan.id) : false}
        connectedAccount={connectedAccount}
        isAnyTxPending={isAnyTxPending}
      />
    </div>
  );
}
