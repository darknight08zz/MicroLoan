"use client";

import React from "react";
import { Loan } from "@/types/loan";
import { Badge } from "@/components/ui/Badge";
import { TxLifecycleStatus } from "@/components/ui/TransactionBanner";
import { getDueDateInfo, formatEth, getRepaymentDisplayInfo } from "@/utils";

export interface LoanTableProps {
  loans: Loan[];
  isLoading: boolean;
  error: string | null;
  errorDetails?: string | null;
  onRetry?: () => void;
  viewMode: "borrower" | "lender-requested" | "lender-portfolio";
  emptyTitle: string;
  emptySubtitle: string;
  
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  isWalletDisconnected?: boolean;
  onConnectWallet?: () => void;
  onWithdraw?: (loan: Loan) => void;
  isWithdrawingLoan?: (loanId: number) => boolean;
  withdrawStatus?: TxLifecycleStatus;
  onRepay?: (loan: Loan) => void;
  isRepayingLoan?: (loanId: number) => boolean;
  repayStatus?: TxLifecycleStatus;
  onFund?: (loan: Loan) => void;
  isFundingLoan?: (loanId: number) => boolean;
  fundStatus?: TxLifecycleStatus;
  connectedAccount?: string | null;
  isAnyTxPending?: boolean;
}

export function LoanTable({
  loans,
  isLoading,
  error,
  errorDetails,
  onRetry,
  viewMode,
  emptyTitle,
  emptySubtitle,
  emptyActionLabel,
  onEmptyAction,
  isWalletDisconnected = false,
  onConnectWallet,
  onWithdraw,
  isWithdrawingLoan,
  withdrawStatus,
  onRepay,
  isRepayingLoan,
  repayStatus,
  onFund,
  isFundingLoan,
  fundStatus,
  connectedAccount,
  isAnyTxPending = false,
}: LoanTableProps) {
  const formatAddress = (addr: string) => {
    if (!addr || addr === "-" || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Requested":
        return <Badge variant="requested" size="sm">Requested</Badge>;
      case "Funded":
        return <Badge variant="funded" size="sm">Funded</Badge>;
      case "Withdrawn":
        return <Badge variant="withdrawn" size="sm">Withdrawn</Badge>;
      case "Repaid":
        return <Badge variant="repaid" size="sm">Repaid</Badge>;
      case "Defaulted":
        return <Badge variant="defaulted" size="sm">Defaulted</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const colSpanCount = viewMode === "borrower" ? 7 : 6;

  return (
    <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-xs bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-slate-200/80 text-[11px] sm:text-xs font-semibold text-slate-600">
              <th className="py-3.5 px-4 font-semibold">ID</th>

              {/* Borrower column for Lender views */}
              {(viewMode === "lender-requested" || viewMode === "lender-portfolio") && (
                <th className="py-3.5 px-4 font-semibold">Borrower</th>
              )}

              <th className="py-3.5 px-4 font-semibold">Principal</th>
              <th className="py-3.5 px-4 font-semibold">Repayment Amount</th>
              <th className="py-3.5 px-4 font-semibold">Due Date</th>

              {/* Lender column for Borrower view */}
              {viewMode === "borrower" && (
                <th className="py-3.5 px-4 font-semibold">Lender</th>
              )}

              {/* Status column for Borrower & Portfolio views */}
              {(viewMode === "borrower" || viewMode === "lender-portfolio") && (
                <th className="py-3.5 px-4 font-semibold">Status</th>
              )}

              {/* Actions column */}
              {(viewMode === "borrower" || viewMode === "lender-requested") && (
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {/* 0. WALLET DISCONNECTED STATE */}
            {isWalletDisconnected && (
              <tr>
                <td colSpan={colSpanCount} className="py-16 px-4 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3 border border-blue-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800">Wallet Not Connected</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Connect your Ethereum wallet to view the micro-loans you have requested.
                    </p>
                    {onConnectWallet && (
                      <button
                        type="button"
                        onClick={onConnectWallet}
                        className="mt-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* 1. LOADING SKELETON ROWS */}
            {!isWalletDisconnected && isLoading && (
              <>
                {[1, 2, 3].map((rowId) => (
                  <tr key={`skeleton-${rowId}`} className="animate-pulse bg-slate-50/50">
                    <td className="py-4 px-4">
                      <div className="h-4 w-8 bg-slate-200 rounded" />
                    </td>
                    {(viewMode === "lender-requested" || viewMode === "lender-portfolio") && (
                      <td className="py-4 px-4">
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                      </td>
                    )}
                    <td className="py-4 px-4">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </td>
                    {viewMode === "borrower" && (
                      <td className="py-4 px-4">
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                      </td>
                    )}
                    {(viewMode === "borrower" || viewMode === "lender-portfolio") && (
                      <td className="py-4 px-4">
                        <div className="h-5 w-16 bg-slate-200 rounded-full" />
                      </td>
                    )}
                    {(viewMode === "borrower" || viewMode === "lender-requested") && (
                      <td className="py-4 px-4 text-right">
                        {viewMode === "borrower" ? (
                          <div className="h-4 w-4 bg-slate-200 rounded ml-auto" />
                        ) : (
                          <div className="h-7 w-16 bg-slate-200 rounded-lg ml-auto" />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </>
            )}

            {/* 2. ERROR STATE ROW */}
            {!isWalletDisconnected && !isLoading && error && (
              <tr>
                <td colSpan={colSpanCount} className="py-12 px-4 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-rose-900">
                      Failed to Read Sepolia Loans
                    </h4>
                    <p className="text-xs text-rose-700 mt-1 max-w-sm leading-relaxed">{error}</p>
                    {errorDetails && (
                      <details className="mt-3 w-full text-left text-[11px] bg-rose-50/70 border border-rose-200/80 rounded-lg p-2.5">
                        <summary className="font-mono text-rose-800 cursor-pointer hover:underline select-none font-medium text-xs">
                          Technical Details (Click to Expand)
                        </summary>
                        <pre className="mt-2 text-[10px] text-rose-900 overflow-x-auto whitespace-pre-wrap font-mono p-2 bg-rose-100/50 rounded border border-rose-200">
                          {errorDetails}
                        </pre>
                      </details>
                    )}
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="mt-3 text-xs font-semibold px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Retry Connection
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* 3. EMPTY STATE ROW */}
            {!isWalletDisconnected && !isLoading && !error && loans.length === 0 && (
              <tr>
                <td colSpan={colSpanCount} className="py-16 px-4 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800">{emptyTitle}</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                      {emptySubtitle}
                    </p>
                    {emptyActionLabel && onEmptyAction && (
                      <button
                        type="button"
                        onClick={onEmptyAction}
                        className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {emptyActionLabel}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* 4. REAL CONTRACT DATA ROWS */}
            {!isWalletDisconnected &&
              !isLoading &&
              !error &&
              loans.length > 0 &&
              loans.map((loan) => {
                const dueInfo = getDueDateInfo(loan.dueDateTimestamp, { loanStatus: loan.status });
                const repayInfo = getRepaymentDisplayInfo(
                  loan,
                  viewMode === "borrower" ? "borrower" : "lender"
                );

                return (
                  <tr key={`loan-row-${loan.id}`} className="hover:bg-slate-50/70 transition-colors">
                    {/* Loan ID */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 text-xs sm:text-sm">{loan.id}</td>

                    {/* Borrower (if in Lender view) */}
                    {(viewMode === "lender-requested" || viewMode === "lender-portfolio") && (
                      <td className="py-3.5 px-4">
                        <span
                          className="font-mono text-slate-700 text-xs font-medium"
                          title={loan.borrower}
                        >
                          {formatAddress(loan.borrower)}
                        </span>
                      </td>
                    )}

                    {/* Principal */}
                    <td className="py-3.5 px-4 font-medium text-slate-900 font-mono text-xs sm:text-sm">
                      {formatEth(loan.principal)}
                    </td>

                    {/* Repayment Amount */}
                    <td className="py-3.5 px-4 text-xs sm:text-sm">
                      {repayInfo.isProminent ? (
                        <div className="inline-flex flex-col items-start gap-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/90 border border-blue-200 text-blue-900 font-mono font-bold text-xs sm:text-sm shadow-xs">
                            <span>{repayInfo.formatted}</span>
                            {repayInfo.badgeLabel && (
                              <span
                                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  repayInfo.badgeColorClass || "bg-blue-600 text-white"
                                }`}
                              >
                                {repayInfo.badgeLabel}
                              </span>
                            )}
                          </div>
                          {repayInfo.subtext && (
                            <span className="text-[10px] text-blue-600 font-medium">
                              {repayInfo.subtext}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-start gap-0.5">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`font-mono text-xs sm:text-sm ${
                                loan.status === "Repaid"
                                  ? "font-semibold text-emerald-700"
                                  : loan.status === "Defaulted"
                                  ? "font-semibold text-rose-700"
                                  : "font-medium text-slate-900"
                              }`}
                            >
                              {repayInfo.formatted}
                            </span>
                            {repayInfo.badgeLabel && (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                  repayInfo.badgeColorClass || "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {repayInfo.badgeLabel}
                              </span>
                            )}
                          </div>
                          {repayInfo.subtext && (
                            <span
                              className={`text-[10px] ${
                                loan.status === "Repaid"
                                  ? "text-emerald-600 font-medium"
                                  : loan.status === "Defaulted"
                                  ? "text-rose-600 font-medium"
                                  : "text-slate-400"
                              }`}
                            >
                              {loan.status === "Repaid" && "✓ "}
                              {repayInfo.subtext}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Due Date & Remaining / Overdue Status */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className="font-medium text-slate-800 text-xs sm:text-sm"
                          title={
                            dueInfo.formattedDateTime !== "Unknown"
                              ? `Due: ${dueInfo.formattedDateTime}`
                              : undefined
                          }
                        >
                          {dueInfo.formattedDate !== "Unknown" ? dueInfo.formattedDate : loan.dueDate}
                        </span>
                        {loan.status !== "Repaid" && dueInfo.label && dueInfo.label !== "No Due Date" && (
                          <span className={dueInfo.badgeClassName}>
                            {dueInfo.label}
                          </span>
                        )}
                      </div>
                    </td>

                  {/* Lender (if in Borrower view) */}
                  {viewMode === "borrower" && (
                    <td className="py-3.5 px-4">
                      {loan.lender === "-" ? (
                        <span className="text-slate-400 text-xs font-mono">-</span>
                      ) : (
                        <span
                          className="font-mono text-slate-700 text-xs font-medium"
                          title={loan.lender}
                        >
                          {formatAddress(loan.lender)}
                        </span>
                      )}
                    </td>
                  )}

                  {/* Status */}
                  {(viewMode === "borrower" || viewMode === "lender-portfolio") && (
                    <td className="py-3.5 px-4">
                      {getStatusBadge(loan.status)}
                    </td>
                  )}

                  {/* Actions Column */}
                  {viewMode === "borrower" && (
                    <td className="py-3.5 px-4 text-right">
                      {loan.status === "Funded" ? (
                        <button
                          type="button"
                          onClick={() => onWithdraw && onWithdraw(loan)}
                          disabled={(isWithdrawingLoan ? isWithdrawingLoan(loan.id) : false) || isAnyTxPending}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs btn-interactive cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          title="Withdraw funded loan principal to your connected wallet"
                        >
                          {isWithdrawingLoan && isWithdrawingLoan(loan.id) ? (
                            <>
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>
                                {withdrawStatus === "waiting_metamask"
                                  ? "Confirm in MetaMask"
                                  : withdrawStatus === "submitted" || withdrawStatus === "pending"
                                  ? "Transaction pending..."
                                  : "Withdrawing..."}
                              </span>
                            </>
                          ) : (
                            <span>Withdraw</span>
                          )}
                        </button>
                      ) : loan.status === "Withdrawn" ? (
                        <button
                          type="button"
                          onClick={() => onRepay && onRepay(loan)}
                          disabled={(isRepayingLoan ? isRepayingLoan(loan.id) : false) || isAnyTxPending}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs btn-interactive cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          title={`Repay exactly ${loan.repayment} to lender ${formatAddress(loan.lender)}`}
                        >
                          {isRepayingLoan && isRepayingLoan(loan.id) ? (
                            <>
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>
                                {repayStatus === "waiting_metamask"
                                  ? "Confirm in MetaMask"
                                  : repayStatus === "submitted" || repayStatus === "pending"
                                  ? "Transaction pending..."
                                  : "Repaying..."}
                              </span>
                            </>
                          ) : (
                            <span>Repay</span>
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">-</span>
                      )}
                    </td>
                  )}

                  {viewMode === "lender-requested" && (
                    <td className="py-3.5 px-4 text-right">
                      {loan.status === "Requested" ? (
                        (() => {
                          const isSelf =
                            Boolean(connectedAccount) &&
                            loan.borrower.toLowerCase() === connectedAccount?.toLowerCase();
                          const isLoading = isFundingLoan ? isFundingLoan(loan.id) : false;

                          return (
                            <button
                              type="button"
                              onClick={() => onFund && onFund(loan)}
                              disabled={isLoading || isSelf || isAnyTxPending}
                              title={
                                isSelf
                                  ? "Borrower cannot fund own loan"
                                  : `Fund this loan with ${loan.principal}`
                              }
                              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-xs btn-interactive inline-flex items-center gap-1.5 ${
                                isSelf
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                              }`}
                            >
                              {isLoading ? (
                                <>
                                  <svg
                                    className="w-3.5 h-3.5 animate-spin"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                  <span>
                                    {fundStatus === "waiting_metamask"
                                      ? "Confirm in MetaMask"
                                      : fundStatus === "submitted" || fundStatus === "pending"
                                      ? "Transaction pending..."
                                      : "Funding..."}
                                  </span>
                                </>
                              ) : (
                                <span>Fund</span>
                              )}
                            </button>
                          );
                        })()
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">-</span>
                      )}
                    </td>
                  )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
