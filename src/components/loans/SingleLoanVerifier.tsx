"use client";

import React, { useState } from "react";
import { useLoanDetails } from "@/contracts/hooks/useLoanDetails";
import { Badge } from "@/components/ui/Badge";
import { getMicroLoanContractAddress, SEPOLIA_EXPLORER_URL } from "@/contracts/config";
import { formatEth } from "@/utils";

interface SingleLoanVerifierProps {
  initialLoanId?: number;
  className?: string;
}

export function SingleLoanVerifier({ initialLoanId = 0, className = "" }: SingleLoanVerifierProps) {
  const contractAddress = getMicroLoanContractAddress();
  const [inputId, setInputId] = useState<string>(String(initialLoanId));
  const [activeQueryId, setActiveQueryId] = useState<number | null>(initialLoanId);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { loan, isLoading, error, loanCount, refetch } = useLoanDetails(activeQueryId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputId, 10);
    setActiveQueryId(isNaN(parsed) ? null : parsed);
  };

  const handlePresetSelect = (id: number) => {
    setInputId(String(id));
    setActiveQueryId(id);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1500);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr === "-" || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div
      className={`bg-[#ffffff] rounded-[16px] border border-[#e5e5e5] overflow-hidden ${className}`}
    >
      {/* Header bar */}
      <div className="border-b border-[#e5e5e5] px-6 py-4 bg-[#fafafa] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#111111] tracking-tight">
              On-Chain Loan Tuple Inspector
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#16803c] border border-[#bbf7d0]">
              Sepolia Direct Read
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5">
            Querying contract{" "}
            <a
              href={`${SEPOLIA_EXPLORER_URL}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[#111111] hover:underline"
              title={contractAddress}
            >
              {formatAddress(contractAddress)}
            </a>
          </p>
        </div>

        {loanCount !== null && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#ffffff] border border-[#e5e5e5] text-xs text-[#666666] self-start sm:self-auto">
            <span>Total Loans on Chain:</span>
            <span className="font-bold text-[#111111]">{loanCount}</span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Search & Preset Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-[#888888] font-mono">
                #
              </span>
              <input
                type="number"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="Enter Loan ID (e.g. 0)"
                className="w-full pl-8 pr-3 py-2 bg-[#ffffff] border border-[#e5e5e5] text-[#111111] text-xs rounded-[8px] focus:outline-none focus:border-[#111111] font-mono placeholder:font-sans placeholder:text-[#999999] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#111111] hover:bg-[#2a2a2a] text-[#ffffff] text-xs font-medium rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? "Reading..." : "Read"}
            </button>
          </form>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[#666666] mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => handlePresetSelect(0)}
              className="px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#e5e5e5] bg-[#ffffff] hover:bg-[#f5f5f5] text-[#111111] transition-colors cursor-pointer"
            >
              #0
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect(1)}
              className="px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#e5e5e5] bg-[#ffffff] hover:bg-[#f5f5f5] text-[#111111] transition-colors cursor-pointer"
            >
              #1
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading}
              title="Refetch from RPC"
              className="p-1.5 text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] rounded-[6px] border border-[#e5e5e5] transition-colors cursor-pointer disabled:opacity-50"
            >
              ↻
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="p-8 rounded-[12px] border border-[#e5e5e5] bg-[#fafafa] flex flex-col items-center justify-center text-center">
            <div className="w-5 h-5 rounded-full border-2 border-[#e5e5e5] border-t-[#111111] animate-spin mb-3" />
            <span className="text-xs font-medium text-[#111111]">
              Querying Sepolia Smart Contract...
            </span>
          </div>
        )}

        {/* ERROR STATE */}
        {!isLoading && error && (
          <div className="p-4 rounded-[12px] border border-[#fecaca] bg-[#fef2f2] text-[#b42318] flex items-center justify-between text-xs">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-2.5 py-1 bg-[#111111] text-white rounded-[6px] cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* SUCCESS / LOAN DETAILS STATE */}
        {!isLoading && !error && loan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-[12px] bg-[#fafafa] border border-[#e5e5e5]">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#666666] font-semibold block">
                  Loan ID
                </span>
                <span className="text-base font-bold text-[#111111] font-mono">
                  #{loan.id}
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#666666] font-semibold block">
                  Status
                </span>
                <Badge variant={loan.status === "Repaid" ? "repaid" : "neutral"} size="sm" dot>
                  {loan.status}
                </Badge>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#666666] font-semibold block">
                  Principal
                </span>
                <span className="text-base font-bold text-[#111111]">
                  {formatEth(loan.principal)}
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#666666] font-semibold block">
                  Repayment
                </span>
                <span className="text-base font-bold text-[#111111]">
                  {formatEth(loan.repayment)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[8px] border border-[#e5e5e5] bg-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#666666] block">Borrower</span>
                  <span className="font-mono text-[#111111]">{loan.borrower}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(loan.borrower, "b")}
                  className="text-[11px] text-[#666666] hover:text-[#111111] cursor-pointer"
                >
                  {copiedField === "b" ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="p-3 rounded-[8px] border border-[#e5e5e5] bg-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#666666] block">Lender</span>
                  <span className="font-mono text-[#111111]">
                    {loan.lender === "-" ? "Unfunded" : loan.lender}
                  </span>
                </div>
                {loan.lender !== "-" && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(loan.lender, "l")}
                    className="text-[11px] text-[#666666] hover:text-[#111111] cursor-pointer"
                  >
                    {copiedField === "l" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
