"use client";

import React, { useState, useMemo } from "react";
import { Loan } from "@/types/loan";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatEth, getDueDateInfo, getRepaymentDisplayInfo } from "@/utils";
import { SEPOLIA_EXPLORER_URL } from "@/contracts/config";

export interface LenderDashboardProps {
  portfolioLoans: Loan[];
  isLoading: boolean;
  onExploreMarketplaceClick?: () => void;
  connectedAccount?: string | null;
  onConnectWallet?: () => void;
}

export function LenderDashboard({
  portfolioLoans,
  isLoading,
  onExploreMarketplaceClick,
  connectedAccount,
  onConnectWallet,
}: LenderDashboardProps) {
  const [filterTab, setFilterTab] = useState<"all" | "active" | "repaid">("all");

  // Strict case-insensitive filtering for the connected lender's funded portfolio
  const userPortfolioLoans = useMemo(() => {
    if (!connectedAccount) return [];
    const normalized = connectedAccount.toLowerCase();
    return portfolioLoans.filter(
      (l) => l.lender.toLowerCase() === normalized && l.status !== "Requested"
    );
  }, [portfolioLoans, connectedAccount]);

  const filteredLoans = useMemo(() => {
    if (filterTab === "active") {
      return userPortfolioLoans.filter((l) => l.status === "Funded" || l.status === "Withdrawn");
    }
    if (filterTab === "repaid") {
      return userPortfolioLoans.filter((l) => l.status === "Repaid");
    }
    return userPortfolioLoans;
  }, [userPortfolioLoans, filterTab]);

  // Financial calculations strictly for the connected lender's portfolio
  let totalSuppliedEth = 0;
  let totalExpectedRepaymentEth = 0;
  let activeLoansCount = 0;
  let repaidLoansCount = 0;

  for (const l of userPortfolioLoans) {
    const p = parseFloat(l.principal.replace(/\s*ETH/gi, "")) || 0;
    const r = parseFloat(l.repayment.replace(/\s*ETH/gi, "")) || p;
    totalSuppliedEth += p;
    totalExpectedRepaymentEth += r;
    if (l.status === "Funded" || l.status === "Withdrawn") {
      activeLoansCount++;
    } else if (l.status === "Repaid") {
      repaidLoansCount++;
    }
  }

  const formatAddress = (addr: string) => {
    if (!addr || addr === "-" || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // 1. Disconnected Wallet Empty State: Never display personal portfolio metrics when disconnected
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
            Connect your wallet to view your funded portfolio.
          </div>
          <p className="text-xs text-[#666666] max-w-sm mx-auto mb-6">
            Please connect your MetaMask wallet to monitor the loans you have funded and track expected returns.
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
      {/* Portfolio Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
            Total Capital Supplied
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            {totalSuppliedEth > 0 ? `${totalSuppliedEth.toFixed(4).replace(/\.?0+$/, "")} ETH` : "0.00 ETH"}
          </div>
          <span className="text-xs text-[#666666] mt-1 block">
            Locked in loans on Sepolia
          </span>
        </div>

        <div className="p-6 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
            Expected Returns
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            {totalExpectedRepaymentEth > 0 ? `${totalExpectedRepaymentEth.toFixed(4).replace(/\.?0+$/, "")} ETH` : "0.00 ETH"}
          </div>
          <span className="text-xs text-[#666666] mt-1 block">
            Principal + agreed lender fees
          </span>
        </div>

        <div className="p-6 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
            Active Loans
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            {activeLoansCount}
          </div>
          <span className="text-xs text-[#666666] mt-1 block">
            Awaiting borrower repayment
          </span>
        </div>

        <div className="p-6 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
            Repaid / Settled
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            {repaidLoansCount}
          </div>
          <span className="text-xs text-[#666666] mt-1 block">
            Successfully returned
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-1">
          {[
            { id: "all", label: "All Portfolio", count: userPortfolioLoans.length },
            { id: "active", label: "Active Loans", count: activeLoansCount },
            { id: "repaid", label: "Settled Loans", count: repaidLoansCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as "all" | "active" | "repaid")}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
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

        {onExploreMarketplaceClick && (
          <Button variant="secondary" size="sm" onClick={onExploreMarketplaceClick}>
            + Fund More Loans
          </Button>
        )}
      </div>

      {/* Portfolio Loans Table / Cards */}
      {isLoading && userPortfolioLoans.length === 0 ? (
        <div className="p-16 text-center bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <div className="w-5 h-5 rounded-full border-2 border-[#e5e5e5] border-t-[#111111] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#666666]">Querying your funded portfolio from Sepolia...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="p-16 text-center bg-[#ffffff] border border-[#e5e5e5] rounded-[16px]">
          <div className="text-base font-bold text-[#111111] mb-1">No Portfolio Loans</div>
          <p className="text-xs text-[#666666] max-w-sm mx-auto mb-4">
            You have not funded any active loans in this category yet. Browse open borrower requests in the marketplace to start lending.
          </p>
          {onExploreMarketplaceClick && (
            <Button variant="primary" size="md" onClick={onExploreMarketplaceClick}>
              Explore Open Requests
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => {
            const dueInfo = getDueDateInfo(loan.dueDateTimestamp);
            const repaymentInfo = getRepaymentDisplayInfo(loan);

            return (
              <div
                key={loan.id}
                className="p-6 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px] hover:border-[#d4d4d4] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 flex-1">
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-1">
                      Loan ID
                    </span>
                    <span className="font-mono text-sm font-bold text-[#111111] block">
                      #{loan.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-1">
                      Borrower
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-[#111111]">
                        {formatAddress(loan.borrower)}
                      </span>
                      <a
                        href={`${SEPOLIA_EXPLORER_URL}/address/${loan.borrower}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#666666] hover:text-[#111111]"
                      >
                        ↗
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-1">
                      Principal Supplied
                    </span>
                    <span className="font-bold text-base text-[#111111] block">
                      {formatEth(loan.principal)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-1">
                      Expected Repayment
                    </span>
                    <span className="font-bold text-base text-[#111111] block">
                      {repaymentInfo.formatted}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#666666] block mb-1">
                      Due Date & Status
                    </span>
                    <span className="text-xs font-medium text-[#111111] block">
                      {dueInfo.formattedDate}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={
                          loan.status === "Repaid"
                            ? "repaid"
                            : loan.status === "Defaulted"
                            ? "defaulted"
                            : loan.status === "Withdrawn"
                            ? "withdrawn"
                            : "funded"
                        }
                        size="sm"
                        dot
                      >
                        {loan.status}
                      </Badge>
                      {loan.status !== "Repaid" && dueInfo.isPastDue && (
                        <span className="text-[10px] font-bold text-[#b42318]">
                          Past Due
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <a
                    href={`${SEPOLIA_EXPLORER_URL}/address/${loan.borrower}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 border border-[#d9d9d9] hover:bg-[#f5f5f5] text-[#111111] rounded-[8px] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Explorer ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
