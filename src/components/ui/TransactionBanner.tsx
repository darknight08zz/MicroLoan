"use client";

import React from "react";
import { SEPOLIA_EXPLORER_URL } from "@/contracts/config";

export type TxLifecycleStatus =
  | "ready"
  | "waiting_metamask"
  | "submitted"
  | "pending"
  | "confirmed"
  | "failed"
  | "rejected";

export interface TransactionBannerProps {
  operationName: string;
  status: TxLifecycleStatus;
  txHash?: string | null;
  errorMessage?: string | null;
  technicalDetails?: string | null;
  actionHint?: {
    label: string;
    url?: string;
    onClick?: () => void;
  };
  successTitle?: string;
  successMessage?: string;
  pendingMessage?: string;
  onDismiss: () => void;
  className?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Reusable transaction lifecycle feedback banner matching the monochromatic financial aesthetic.
 * Communicates all 7 transaction states clearly without heavy colorful backgrounds:
 * 1. Ready (hidden)
 * 2. Waiting for MetaMask (pulsing prompt)
 * 3. Transaction submitted (broadcasted with tx hash)
 * 4. Transaction pending (mining on Sepolia with explorer link)
 * 5. Transaction confirmed (restrained #16803C indicator)
 * 6. Transaction failed (restrained #B42318 indicator)
 * 7. User rejected (restrained #A16207 indicator)
 */
export function TransactionBanner({
  operationName,
  status,
  txHash,
  errorMessage,
  technicalDetails,
  actionHint,
  successTitle = "Transaction Confirmed",
  successMessage,
  pendingMessage,
  onDismiss,
  className = "",
  actionButton,
}: TransactionBannerProps) {
  if (status === "ready") {
    return null;
  }

  return (
    <div className={`mb-6 rounded-[16px] text-xs transition-all ${className}`}>
      {/* 2. Waiting for MetaMask */}
      {status === "waiting_metamask" && (
        <div className="p-4 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px] flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="w-4 h-4 rounded-full border-2 border-[#e5e5e5] border-t-[#111111] animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold block text-[#111111]">
              Confirm in MetaMask
            </span>
            <span className="text-[#666666] text-xs block mt-0.5">
              Please review and approve the <code className="font-mono bg-[#f5f5f5] px-1 py-0.5 rounded text-[#111111]">{operationName}</code> transaction in your MetaMask wallet extension.
            </span>
          </div>
        </div>
      )}

      {/* 3 & 4. Transaction Submitted & Pending on Sepolia */}
      {(status === "submitted" || status === "pending") && (
        <div className="p-4 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px] flex items-start gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="w-4 h-4 rounded-full border-2 border-[#e5e5e5] border-t-[#111111] animate-spin shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#111111]">
                {status === "submitted" ? "Transaction Submitted" : "Transaction Pending"}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[#4b5563] text-[10px] font-mono font-medium border border-[#e5e5e5]">
                Sepolia
              </span>
            </div>
            <span className="text-[#666666] text-xs block mt-0.5 leading-relaxed">
              {pendingMessage || `Your ${operationName} transaction is being confirmed on the Ethereum Sepolia blockchain.`}
            </span>
            {txHash && (
              <div className="mt-2">
                <a
                  href={`${SEPOLIA_EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#111111] hover:underline inline-flex items-center gap-1 text-[11px] font-medium"
                >
                  View on Sepolia Explorer ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Transaction Confirmed */}
      {status === "confirmed" && (
        <div className="p-4 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-5 h-5 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#16803c] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm text-[#111111] block">
                {successTitle}
              </span>
              <span className="text-[#666666] text-xs block mt-0.5 leading-relaxed">
                {successMessage || `Your ${operationName} was successfully mined and confirmed on Ethereum Sepolia.`}
              </span>
              {txHash && (
                <div className="mt-1.5">
                  <a
                    href={`${SEPOLIA_EXPLORER_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#111111] hover:underline inline-flex items-center gap-1 text-[11px] font-medium"
                  >
                    View on Sepolia Explorer ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {actionButton && (
              <button
                type="button"
                onClick={actionButton.onClick}
                className="px-3 py-1.5 bg-[#111111] hover:bg-[#2a2a2a] text-[#ffffff] font-medium rounded-[8px] transition-colors cursor-pointer text-xs"
              >
                {actionButton.label}
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="px-2.5 py-1.5 border border-[#d9d9d9] bg-[#ffffff] text-[#111111] hover:bg-[#f5f5f5] rounded-[8px] transition-colors cursor-pointer text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 6. Transaction Failed */}
      {status === "failed" && (
        <div className="p-4 bg-[#ffffff] border border-[#fecaca] rounded-[16px] flex items-start justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="w-5 h-5 rounded-full bg-[#fef2f2] border border-[#fecaca] text-[#b42318] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold block text-[#111111]">
                Transaction Failed
              </span>
              <span className="text-[#666666] text-xs block mt-0.5 leading-relaxed break-words">
                {errorMessage || `Failed to execute ${operationName} on Sepolia.`}
              </span>

              {actionHint && (
                <div className="mt-2">
                  {actionHint.url ? (
                    <a
                      href={actionHint.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#111111] hover:bg-[#2a2a2a] text-[#ffffff] rounded-[8px] text-xs font-medium transition-colors"
                    >
                      {actionHint.label}
                    </a>
                  ) : actionHint.onClick ? (
                    <button
                      type="button"
                      onClick={actionHint.onClick}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#111111] hover:bg-[#2a2a2a] text-[#ffffff] rounded-[8px] text-xs font-medium transition-colors cursor-pointer"
                    >
                      {actionHint.label}
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#b42318] font-medium block">
                      {actionHint.label}
                    </span>
                  )}
                </div>
              )}

              {txHash && (
                <div className="mt-2">
                  <a
                    href={`${SEPOLIA_EXPLORER_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#111111] hover:underline inline-flex items-center gap-1 text-[11px] font-medium"
                  >
                    View on Sepolia Explorer ↗
                  </a>
                </div>
              )}

              {technicalDetails && (
                <details className="mt-2 group/debug text-xs">
                  <summary className="cursor-pointer font-mono text-[11px] text-[#666666] hover:text-[#111111] select-none inline-flex items-center gap-1">
                    <span>▸</span> Details
                  </summary>
                  <pre className="mt-1.5 p-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[8px] text-[10px] font-mono text-[#333333] whitespace-pre-wrap break-all max-h-44 overflow-y-auto leading-relaxed">
                    {technicalDetails}
                  </pre>
                </details>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-medium px-2.5 py-1 border border-[#d9d9d9] bg-[#ffffff] hover:bg-[#f5f5f5] text-[#111111] rounded-[8px] transition-colors cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 7. User Rejected in MetaMask */}
      {status === "rejected" && (
        <div className="p-4 bg-[#ffffff] border border-[#e5e5e5] rounded-[16px] flex items-start justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="w-5 h-5 rounded-full bg-[#fefce8] border border-[#fef08a] text-[#a16207] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold block text-[#111111]">
                Transaction Cancelled
              </span>
              <span className="text-[#666666] text-xs block mt-0.5 leading-relaxed">
                {errorMessage || "You rejected the transaction in MetaMask."}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-medium px-2.5 py-1 border border-[#d9d9d9] bg-[#ffffff] hover:bg-[#f5f5f5] text-[#111111] rounded-[8px] transition-colors cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
