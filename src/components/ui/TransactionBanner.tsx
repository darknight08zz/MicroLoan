"use client";

import React, { useEffect } from "react";
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
  autoDismissMs?: number;
}


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
  autoDismissMs,
}: TransactionBannerProps) {
  // Auto-dismiss after 5s on confirmation, 4s on rejection
  const delay =
    autoDismissMs ?? (status === "confirmed" ? 5000 : status === "rejected" ? 4000 : 0);

  useEffect(() => {
    if (delay > 0 && (status === "confirmed" || status === "rejected")) {
      const timer = setTimeout(() => {
        onDismiss();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [status, delay, onDismiss]);

  if (status === "ready") {
    return null;
  }

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-[14px] bg-[#ffffff] border border-[#e5e5e5] p-4 shadow-xl text-xs transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${className}`}
      role="alert"
    >
      {/* 1. Waiting for MetaMask */}
      {status === "waiting_metamask" && (
        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-[#e5e5e5] border-t-[#111111] animate-spin shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 pr-6">
            <span className="font-semibold block text-[#111111]">
              Confirm in MetaMask
            </span>
            <span className="text-[#666666] text-xs block mt-0.5 leading-relaxed">
              Please review and approve the <code className="font-mono bg-[#f5f5f5] px-1 py-0.5 rounded text-[#111111]">{operationName}</code> request in your wallet.
            </span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="text-[#888888] hover:text-[#111111] text-sm font-bold leading-none p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Transaction Submitted & Pending on Sepolia */}
      {(status === "submitted" || status === "pending") && (
        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-[#e5e5e5] border-t-[#111111] animate-spin shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#111111]">
                {status === "submitted" ? "Transaction Submitted" : "Transaction Pending"}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[#4b5563] text-[10px] font-mono font-medium border border-[#e5e5e5]">
                Sepolia
              </span>
            </div>
            <span className="text-[#666666] text-xs block mt-0.5 leading-relaxed">
              {pendingMessage || `Your ${operationName} is being confirmed on Sepolia.`}
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
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="text-[#888888] hover:text-[#111111] text-sm font-bold leading-none p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Transaction Confirmed */}
      {status === "confirmed" && (
        <>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#16803c] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <span className="font-semibold text-sm text-[#111111] block">
                {successTitle}
              </span>
              <span className="text-[#666666] text-xs block mt-0.5 leading-relaxed">
                {successMessage || `Your ${operationName} was successfully confirmed.`}
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
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close"
              className="text-[#888888] hover:text-[#111111] text-sm font-bold leading-none p-1 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          {actionButton && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={actionButton.onClick}
                className="px-3 py-1 bg-[#111111] hover:bg-[#2a2a2a] text-[#ffffff] font-medium rounded-[8px] transition-colors cursor-pointer text-xs"
              >
                {actionButton.label}
              </button>
            </div>
          )}

          {/* Animated 5s auto-dismiss progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e5e5e5] overflow-hidden">
            <div
              className="h-full bg-[#16803c]"
              style={{
                animation: `toastCountdown ${delay}ms linear forwards`,
              }}
            />
          </div>
        </>
      )}

      {/* 4. Transaction Failed */}
      {status === "failed" && (
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#fef2f2] border border-[#fecaca] text-[#b42318] flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 pr-4">
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

            {technicalDetails && (
              <details className="mt-2 group/debug text-xs">
                <summary className="cursor-pointer font-mono text-[11px] text-[#666666] hover:text-[#111111] select-none inline-flex items-center gap-1">
                  <span>▸</span> Details
                </summary>
                <pre className="mt-1.5 p-2 bg-[#fafafa] border border-[#e5e5e5] rounded-[8px] text-[10px] font-mono text-[#333333] whitespace-pre-wrap break-all max-h-36 overflow-y-auto leading-relaxed">
                  {technicalDetails}
                </pre>
              </details>
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="text-[#888888] hover:text-[#111111] text-sm font-bold leading-none p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* 5. User Rejected in MetaMask */}
      {status === "rejected" && (
        <>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#fefce8] border border-[#fef08a] text-[#a16207] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <span className="font-semibold block text-[#111111]">
                Transaction Cancelled
              </span>
              <span className="text-[#666666] text-xs block mt-0.5 leading-relaxed">
                {errorMessage || "You rejected the transaction in MetaMask."}
              </span>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close"
              className="text-[#888888] hover:text-[#111111] text-sm font-bold leading-none p-1 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e5e5e5] overflow-hidden">
            <div
              className="h-full bg-[#a16207]"
              style={{
                animation: `toastCountdown ${delay}ms linear forwards`,
              }}
            />
          </div>
        </>
      )}

      {/* Inline styles for toast animation */}
      <style jsx>{`
        @keyframes toastCountdown {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
